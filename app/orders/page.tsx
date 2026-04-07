'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { Order, Delivery } from '@/lib/types';
import { formatCurrency } from '@/lib/currency';

const LiveTrackingMap = dynamic(() => import('@/components/LiveTrackingMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>,
});

export default function OrdersPage() {
  const { state } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!state.user?.id) return;
    try {
      const response = await fetch(`/api/orders?userId=${encodeURIComponent(state.user.id)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load orders');
      }
      setOrders(payload.data || []);
      if (!selectedOrder && payload.data?.length) {
        setSelectedOrder(payload.data[0]);
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!state.user) {
      router.push('/login');
      return;
    }

    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, [state.user]);

  const currentDelivery = selectedOrder?.delivery as Delivery | undefined;
  const statusLabel = selectedOrder?.delivery?.status
    ? selectedOrder.delivery.status === 'assigned'
      ? 'Accepted by agent'
      : selectedOrder.delivery.status === 'in_progress'
      ? 'Out for delivery'
      : 'Delivered'
    : 'Waiting for assignment';

  if (loading) {
    return <div className="text-center py-16">Loading your orders...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
              You have no orders yet.
            </div>
          ) : (
            orders.map((order) => {
              const delivery = order.delivery as Delivery | null;
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full text-left bg-white p-5 rounded-lg shadow-sm border transition ${
                    selectedOrder?.id === order.id ? 'border-blue-500 ring-1 ring-blue-200' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Order #{order.id.slice(-8)}</span>
                    <span className={delivery ? 'text-xs uppercase tracking-wide text-green-700' : 'text-xs uppercase tracking-wide text-yellow-700'}>
                      {delivery ? (delivery.status === 'assigned' ? 'Accepted' : delivery.status === 'in_progress' ? 'On the way' : 'Delivered') : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total: {formatCurrency(order.total_amount)}</p>
                  <p className="text-sm text-gray-600">{order.delivery ? `Delivery ${order.delivery.status}` : 'Waiting for agent assignment'}</p>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedOrder ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Order #{selectedOrder.id.slice(-8)}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {statusLabel}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">Order Total</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(selectedOrder.total_amount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">Delivery Address</p>
                  <p className="mt-1 text-gray-900">{selectedOrder.delivery_address}</p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Order Items</p>
                <ul className="mt-3 space-y-2">
                  {selectedOrder.order_items?.map((item: any) => (
                    <li key={item.id} className="flex justify-between text-sm text-gray-700">
                      <span>{item.product?.name ?? item.product_id} x{item.quantity}</span>
                      <span>{formatCurrency(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {currentDelivery ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Live Delivery Tracking</h3>
                  <LiveTrackingMap
                    delivery={currentDelivery}
                    orderAddress={selectedOrder.delivery_address}
                    destinationCoordinates={
                      selectedOrder.delivery_lat != null && selectedOrder.delivery_lng != null
                        ? [selectedOrder.delivery_lat, selectedOrder.delivery_lng]
                        : undefined
                    }
                    onLocationUpdate={() => {} }
                  />
                </div>
              ) : (
                <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-900">
                  Your order is still waiting for a delivery agent to accept it. Live tracking will appear once it is assigned.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-gray-500 text-center">
              Select an order from the left to see details and tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
