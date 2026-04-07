'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';

export default function OrderConfirmationPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('order_id');
    setOrderId(id);

    if (!id) {
      setError('Invalid order');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders?orderId=${encodeURIComponent(id)}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load order');
        }

        setOrder(payload.data?.[0] ?? null);
      } catch (err: any) {
        setError(err.message || 'Unable to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, []);

  if (loading) {
    return <div className="text-center py-16">Loading order details...</div>;
  }

  if (error) {
    return <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-red-600">{error}</div>;
  }

  if (!orderId) {
    return <div>Invalid order</div>;
  }

  const statusLabel = order?.delivery?.status
    ? order.delivery.status === 'assigned'
      ? 'Accepted by agent'
      : order.delivery.status === 'in_progress'
      ? 'Out for delivery'
      : 'Delivered'
    : 'Order placed';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8">
        <div className="text-4xl font-semibold text-green-700 mb-4">Success</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully</h1>
        <p className="text-gray-600 mb-6">Your order was placed successfully after you completed the order.</p>
        <div className="bg-white p-4 rounded-md shadow-sm mb-6 text-left">
          <p className="text-sm text-gray-600">Order ID: {orderId}</p>
          <p className="text-sm text-gray-600">Total: {typeof order?.total_amount === 'number' ? formatCurrency(order.total_amount) : 'N/A'}</p>
          <p className="text-sm text-gray-600">Status: <span className="font-semibold">{statusLabel}</span></p>
          {order?.delivery && (
            <p className="text-sm text-gray-600">Delivery agent status: <span className="font-semibold">{order.delivery.status}</span></p>
          )}
        </div>
        <div className="space-x-4">
          <Link
            href="/products"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Order More
          </Link>
          <Link
            href="/orders"
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
          >
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
