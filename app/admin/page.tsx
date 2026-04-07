'use client';

import { useEffect, useState } from 'react';
import { Order, Delivery, User } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { state } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user || state.user.role !== 'admin') {
      router.push('/login');
      return;
    }
    fetchOrders();
    fetchAgents();
  }, [state.user, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load orders');
      }
      setOrders(payload.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load agents');
      }
      setAgents(payload.data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    }
  };

  const acceptOrder = async (orderId: string, agentId: string) => {
    try {
      const response = await fetch('/api/admin/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, agentId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to accept order');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      if (!confirm('Cancel this order? This cannot be undone.')) return;
      const response = await fetch('/api/admin/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to cancel order');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      if (!confirm('Delete this order permanently?')) return;
      const response = await fetch('/api/admin/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete order');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  if (!state.user || state.user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Portal</h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Orders Management</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No pending orders
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Order #{order.id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">
                      Total: ${order.total_amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Address: {order.delivery_address}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {order.status}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {order.status === 'pending' ? (
                      <select
                        aria-label="Assign agent to order"
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            acceptOrder(order.id, e.target.value);
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">Assign Agent</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-green-600 font-semibold">{order.status === 'accepted' ? 'Accepted' : order.status === 'in_progress' ? 'In Progress' : order.status === 'completed' ? 'Completed' : order.status === 'cancelled' ? 'Cancelled' : order.status}</span>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}