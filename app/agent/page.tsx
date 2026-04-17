'use client';

import { useEffect, useState } from 'react';
import { Order } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/lib/supabase';

// Helper to get agent's real GPS position
function getAgentGPS(): Promise<[number, number] | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// Dynamically import the map component to avoid SSR issues
const LiveTrackingMap = dynamic(() => import('@/components/LiveTrackingMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
});

export default function AgentPage() {
  const { state } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [agentPosition, setAgentPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (state.user && state.user.role === 'agent') {
      fetchOrders();
      // Fast refresh for agents to catch new assignments
      const interval = setInterval(fetchOrders, 6000);
      return () => clearInterval(interval);
    }
  }, [state.user]);

  const fetchOrders = async () => {
    try {
      const agentId = state.user?.id;
      if (!agentId) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.warn('Error fetching agent orders:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const openMap = async (order: Order) => {
    // Get the agent's real GPS position when they open the map
    const gps = await getAgentGPS();
    setAgentPosition(gps);
    setSelectedOrder(order);
  };

  const updateOrderStatus = async (orderId: string, status: 'in_progress' | 'completed') => {
    try {
      // Local state update first
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.warn('Live DB update failed:', error.message || error);
        return;
      }
    } catch (error: any) {
      console.warn('Error updating status:', error.message || error);
    }
  };

  const updateLocation = async (orderId: string, lat: number, lng: number) => {
    try {
      await supabase
        .from('orders')
        .update({ current_lat: lat, current_lng: lng })
        .eq('id', orderId);
    } catch (error: any) {
      console.warn('Error updating location:', error.message || error);
    }
  };

  if (!state.user || state.user.role !== 'agent') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_30%)] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-black mb-2">Agent Portal</h1>
            <p className="text-gray-600">Access your active deliveries and update tracking info.</p>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-blue-100 p-8 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.15)]">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Agent Email</label>
                <input 
                  type="email" 
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="agent@example.com"
                  id="agent-email"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Access Key (Password)</label>
                <input 
                  type="password" 
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="••••••••"
                  id="agent-password"
                />
              </div>
              <button 
                onClick={async () => {
                  const email = (document.getElementById('agent-email') as HTMLInputElement).value;
                  const password = (document.getElementById('agent-password') as HTMLInputElement).value;
                  try {
                    const { error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl active:scale-[0.98]"
              >
                Sign In to Portal
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => router.push('/')}
              className="text-sm font-bold text-gray-400 hover:text-black transition-colors"
            >
              ← Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-4xl font-black text-gray-900 mb-8">Delivery Agent Portal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="text-xl font-bold mb-6 text-gray-800">My Assigned Tasks</h2>
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm text-center text-gray-400 font-medium">
                No active orders assigned to you.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${
                      order.status === 'accepted' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-2 mb-8">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                       {order.delivery_address}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'in_progress')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-100"
                      >
                        Start Delivery
                      </button>
                    )}
                    {order.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => openMap(order)}
                          className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all text-sm shadow-lg"
                        >
                          Open Map
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all text-sm shadow-lg shadow-green-100"
                        >
                          Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-8 h-fit">
          {selectedOrder ? (
            <div className="bg-white p-2 rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-bold text-gray-800">Live Tracking</h2>
                   <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-sm font-bold text-gray-400 hover:text-black transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="rounded-[2rem] overflow-hidden">
                {/* 
                  Passing the consolidated order object. 
                  LiveTrackingMap needs to be updated or it will handle 'order' as delivery 
                */}
                <LiveTrackingMap
                   delivery={{
                     ...selectedOrder as any,
                     current_lat: agentPosition?.[0] ?? (selectedOrder as any).current_lat,
                     current_lng: agentPosition?.[1] ?? (selectedOrder as any).current_lng,
                   }}
                   orderAddress={selectedOrder.delivery_address}
                   destinationCoordinates={
                     selectedOrder.delivery_lat != null && selectedOrder.delivery_lng != null
                       ? [selectedOrder.delivery_lat, selectedOrder.delivery_lng]
                       : undefined
                   }
                   simulateMovement={true}
                   onLocationUpdate={(lat, lng) => updateLocation(selectedOrder.id, lat, lng)}
                 />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 h-[500px] border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Track on Map</h3>
              <p className="text-gray-500 mt-2 max-w-[200px]">Select an active order to start tracking your route.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
