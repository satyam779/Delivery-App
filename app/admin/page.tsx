'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { Order, User } from '@/lib/types';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const { state } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
      setErrorStatus(null);
    } catch (error: any) {
      console.error('Admin order fetch error:', error);
      setErrorStatus(error.message || 'Failed to fetch real-time orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'agent');
      
      if (error) throw error;
      setAgents(data as any || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  useEffect(() => {
    if (state.user && state.user.role === 'admin') {
      fetchOrders();
      fetchAgents();

      const interval = setInterval(fetchOrders, 8000);
      return () => clearInterval(interval);
    }
  }, [state.user]);

  const acceptOrder = async (orderId: string, agentId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'accepted',
          agent_id: agentId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      if (!confirm('Cancel this order?')) return;
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      
      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  if (!state.user || state.user.role !== 'admin') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.1),_transparent_30%)] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-black mb-2">Admin Entrance</h1>
            <p className="text-gray-600">Please sign in with your administrative credentials to continue.</p>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-orange-100 p-8 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.15)]">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Admin Email</label>
                <input 
                  type="email" 
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  placeholder="admin@delivery.com"
                  id="admin-email"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Password</label>
                <input 
                  type="password" 
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  placeholder="••••••••"
                  id="admin-password"
                />
              </div>
              <button 
                onClick={async () => {
                  const email = (document.getElementById('admin-email') as HTMLInputElement).value;
                  const password = (document.getElementById('admin-password') as HTMLInputElement).value;
                  try {
                    const { error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98]"
              >
                Sign In as Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Fetching orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Admin Portal</h1>
          <p className="text-gray-600 mt-1">Manage orders and delivery agents.</p>
        </div>
        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold">
          Admin Session
        </div>
      </div>

      {errorStatus && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">{errorStatus}</span>
          </div>
          <button onClick={fetchOrders} className="text-xs font-bold underline">Retry Now</button>
        </div>
      )}

      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Orders Management</h2>
          <span className="text-xs font-bold text-green-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Sync Active
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {orders.length === 0 ? (
            <div className="px-8 py-20 text-center flex flex-col items-center">
              <span className="text-5xl mb-4">📭</span>
              <h3 className="text-lg font-bold text-gray-800">No Orders Yet</h3>
              <p className="text-gray-400 mt-1">New orders from customers will appear here automatically.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="px-8 py-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-lg text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 max-w-sm truncate">{order.delivery_address}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <p className="font-black text-orange-600">
                        {formatCurrency(order.total_amount)}
                      </p>
                      {order.agent_id && (
                        <p className="text-xs font-bold text-gray-400">
                          Assigned to: <span className="text-gray-900">{order.agent_id}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {order.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <select 
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-100"
                          id={`agent-select-${order.id}`}
                        >
                          <option value="">Select Agent</option>
                          {agents.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
                        </select>
                        <button
                          onClick={() => {
                            const agentSelect = document.getElementById(`agent-select-${order.id}`) as HTMLSelectElement;
                            const agentId = agentSelect.value;
                            if (agentId) acceptOrder(order.id, agentId);
                            else alert('Please select an agent');
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-2"
                    >
                      Cancel
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
