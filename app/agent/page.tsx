'use client';

import { useEffect, useState } from 'react';
import { Delivery } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/currency';

// Dynamically import the map component to avoid SSR issues
const LiveTrackingMap = dynamic(() => import('@/components/LiveTrackingMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
});

export default function AgentPage() {
  const { state } = useApp();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    if (!state.user || state.user.role !== 'agent') {
      router.push('/login');
      return;
    }
    fetchDeliveries();
  }, [state.user, router]);

  const fetchDeliveries = async () => {
    try {
      const agentId = state.user?.id;
      if (!agentId) {
        throw new Error('Agent user is not available');
      }

      const response = await fetch(`/api/agent/deliveries?agentId=${encodeURIComponent(agentId)}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch deliveries');
      }

      setDeliveries(payload.data || []);
    } catch (error: any) {
      console.error('Error fetching deliveries:', error, error?.message, JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: 'in_progress' | 'completed') => {
    try {
      const response = await fetch('/api/agent/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, status }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update delivery status');
      }

      fetchDeliveries();
    } catch (error: any) {
      console.error('Error updating delivery:', error, error?.message, JSON.stringify(error));
      alert('Failed to update delivery status');
    }
  };

  const updateLocation = async (deliveryId: string, lat: number, lng: number) => {
    try {
      const response = await fetch('/api/agent/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, lat, lng }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update location');
      }
    } catch (error: any) {
      console.error('Error updating location:', error, error?.message, JSON.stringify(error));
    }
  };

  if (!state.user || state.user.role !== 'agent') {
    return null;
  }

  if (loading) {
    return <div className="text-center py-8">Loading deliveries...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Delivery Agent Portal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">My Deliveries</h2>
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
                No active deliveries
              </div>
            ) : (
              deliveries.map((delivery) => (
                <div key={delivery.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Order #{delivery.order_id.slice(-8)}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      delivery.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                      delivery.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {delivery.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Address: {delivery.order?.delivery_address}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Total: {delivery.order ? formatCurrency(delivery.order.total_amount) : 'N/A'}
                  </p>
                  <div className="flex space-x-2">
                    {delivery.status === 'assigned' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'in_progress')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Start Delivery
                      </button>
                    )}
                    {delivery.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => setSelectedDelivery(delivery)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                        >
                          Track Location
                        </button>
                        <button
                          onClick={() => updateDeliveryStatus(delivery.id, 'completed')}
                          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
                        >
                          Mark Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          {selectedDelivery ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Live Tracking</h2>
              <LiveTrackingMap
                delivery={selectedDelivery}
                orderAddress={selectedDelivery.order?.delivery_address}
                destinationCoordinates={
                  selectedDelivery.order?.delivery_lat != null && selectedDelivery.order?.delivery_lng != null
                    ? [selectedDelivery.order.delivery_lat, selectedDelivery.order.delivery_lng]
                    : undefined
                }
                simulateMovement={true}
                onLocationUpdate={(lat, lng) => updateLocation(selectedDelivery.id, lat, lng)}
              />
              <button
                onClick={() => setSelectedDelivery(null)}
                className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Stop Tracking
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
              Select a delivery to start tracking
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
