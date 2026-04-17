'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/currency';
import OrderChat from '@/components/OrderChat';

const LiveTrackingMap = dynamic(() => import('@/components/LiveTrackingMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>,
});

import { supabase } from '@/lib/supabase';

export default function OrdersPage() {
  const { state } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [agentPhone, setAgentPhone] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!state.user?.id) return;
    try {
      const response = await fetch(`/api/orders?userId=${encodeURIComponent(state.user.id)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load orders');
      }
      const fetchedOrders = payload.data || [];
      setOrders(fetchedOrders);

      // Fetch agent phone if an order is active
      const activeOrder = fetchedOrders.find((o: Order) => o.agent_id && o.status !== 'completed');
      if (activeOrder?.agent_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', activeOrder.agent_id)
          .single();
        if (profile?.phone) setAgentPhone(profile.phone);
      }

      // Update selected order if it exists in the new data
      if (selectedOrder) {
        const updated = fetchedOrders.find((o: Order) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      } else if (fetchedOrders.length) {
        setSelectedOrder(fetchedOrders[0]);
      }
    } catch (err: any) {
      console.warn('Error loading orders:', err);
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

    // REALTIME SUBSCRIPTION: Listen for live updates to orders
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${state.user.id}`,
        },
        (payload: any) => {
          const updatedOrder = payload.new as Order;
          setOrders((prev) => 
            prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
          );
          
          setSelectedOrder((prev) => {
            if (prev?.id === updatedOrder.id) {
              return { ...prev, ...updatedOrder };
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.user]);

  const getStatusLabel = (order: Order) => {
    if (order.status === 'pending') return 'Waiting for confirmation';
    if (order.status === 'accepted') return 'Accepted by agent';
    if (order.status === 'in_progress') return 'Out for delivery';
    if (order.status === 'completed') return 'Delivered';
    if (order.status === 'cancelled') return 'Cancelled';
    return order.status;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Fetching your orders...</p>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-4xl font-black text-gray-900 mb-8">My Orders</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm text-center text-gray-400 font-medium">
              You haven't placed any orders yet.
            </div>
          ) : (
            orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`w-full text-left bg-white p-6 rounded-[2rem] border transition-all duration-300 ${selectedOrder?.id === order.id
                    ? 'border-blue-500 shadow-[0_15px_40px_-10px_rgba(37,99,235,0.2)]'
                    : 'border-gray-100 hover:border-gray-300 shadow-sm'
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">{formatCurrency(order.total_amount)}</p>
                <p className="text-xs text-gray-500 truncate">{order.delivery_address}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 border-b border-gray-50 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Order Progress</h2>
                  <p className="text-sm text-gray-500 mt-1">Status: <span className="font-bold text-blue-600">{getStatusLabel(selectedOrder)}</span></p>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-2xl text-xs font-bold text-gray-400">
                  ID: {selectedOrder.id}
                </div>
              </div>

              {selectedOrder.agent_id && (
                <div className="flex flex-wrap gap-3 mb-8">
                  <a 
                    href={agentPhone ? `tel:${agentPhone}` : '#'} 
                    onClick={(e) => { if (!agentPhone) { e.preventDefault(); alert('Agent has not provided a contact number yet.'); } }}
                    className={`flex-1 min-w-[140px] ${agentPhone ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-gray-400 cursor-not-allowed'} text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg`}
                  >
                    <span>📞</span> {agentPhone ? 'Call Agent' : 'Waiting for Number'}
                  </a>
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="flex-1 min-w-[140px] bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <span>💬</span> Chat with Agent
                  </button>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="rounded-3xl bg-gray-50 p-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                  <p className="text-2xl font-black text-gray-900">{formatCurrency(selectedOrder.total_amount)}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                  <p className="text-sm font-bold text-gray-900 line-clamp-2">{selectedOrder.delivery_address}</p>
                </div>
              </div>

              <div className="rounded-3xl bg-gray-50 p-8 mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Items</p>
                <div className="space-y-3">
                  {selectedOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-sm font-medium">
                      <span className="text-gray-600">{item.product_id} <span className="text-gray-300 mx-1">×</span> {item.quantity}</span>
                      <span className="text-gray-900 font-bold">{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(selectedOrder.status === 'pending' || selectedOrder.status === 'accepted' || selectedOrder.status === 'in_progress') ? (
                <div className="mt-10 overflow-hidden rounded-[2rem] border border-gray-100">
                  <div className="p-6 bg-blue-50/50 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      Live Tracking
                    </h3>
                  </div>
                  <LiveTrackingMap
                    delivery={selectedOrder as any}
                    orderAddress={selectedOrder.delivery_address}
                    destinationCoordinates={
                      selectedOrder.delivery_lat != null && selectedOrder.delivery_lng != null
                        ? [selectedOrder.delivery_lat, selectedOrder.delivery_lng]
                        : undefined
                    }
                    onLocationUpdate={() => { }}
                  />
                </div>
              ) : selectedOrder.status === 'completed' ? (
                <div className="mt-8 p-10 rounded-[2rem] bg-green-50/50 border border-green-100 text-center">
                  <span className="text-4xl mb-4 block">✅</span>
                  <p className="text-green-800 font-bold text-lg">Order Delivered Successfully!</p>
                  <p className="text-green-600 text-sm mt-1">Thank you for ordering with us.</p>
                </div>
              ) : (
                <div className="mt-8 p-10 rounded-[2rem] bg-amber-50/50 border border-amber-100 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-amber-800 font-bold text-lg">Waiting for Agent Arrival</p>
                  <p className="text-amber-600 text-sm mt-1">Your order is being prepared and will be assigned soon.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 h-[400px] border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-10">
              <span className="text-4xl mb-4">🛍️</span>
              <h3 className="text-lg font-bold text-gray-800">No Order Selected</h3>
              <p className="text-gray-500 mt-2 max-w-[200px]">Select an order from the list to view its real-time progress.</p>
            </div>
          )}
      </div>
    </div>
    </div>
    
    {selectedOrder && state.user && (
      <OrderChat
        orderId={selectedOrder.id}
        recipientName="Delivery Agent"
        currentUserId={state.user.id}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    )}
    </>
  );
}
