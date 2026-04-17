'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Delivery } from '@/lib/types';

// Custom Markers with better styling
const bikeIcon = L.icon({
  iconUrl: '/bike-marker.png',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21],
});

const destinationIcon = L.divIcon({
  html: `<div class="destination-pulse">
          <div class="main-marker">📍</div>
          <div class="pulse-ring"></div>
        </div>`,
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function computeDestinationPosition(center: [number, number], address?: string): [number, number] {
  // Use a very small offset for the fallback computation
  const offset = 0.002;
  if (!address) return [center[0] + offset, center[1] + offset];
  let hash = 0;
  for (let i = 0; i < address.length; i += 1) {
    hash = (hash * 31 + address.charCodeAt(i)) & 0xffffffff;
  }
  const angle = (hash % 360) * (Math.PI / 180);
  return [center[0] + offset * Math.sin(angle), center[1] + offset * Math.cos(angle)];
}

function MapBoundsUpdater({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (positions && positions.length > 0 && positions[0][0] !== 0) {
      map.fitBounds(positions as any, { padding: [80, 80], animate: true });
    }
  }, [positions, map]);
  return null;
}

interface LiveTrackingMapProps {
  delivery: Delivery;
  orderAddress?: string;
  destinationCoordinates?: [number, number];
  simulateMovement?: boolean;
  onLocationUpdate: (lat: number, lng: number) => void;
}

export default function LiveTrackingMap({
  delivery,
  orderAddress,
  destinationCoordinates,
  simulateMovement = false,
  onLocationUpdate,
}: LiveTrackingMapProps) {
  // Initial state logic
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(() => {
    if (delivery.current_lat && delivery.current_lng) return [delivery.current_lat, delivery.current_lng];
    if (destinationCoordinates && destinationCoordinates[0] !== 0) return [destinationCoordinates[0] - 0.005, destinationCoordinates[1] - 0.005];
    return [0, 0]; // Loading state
  });

  const [destinationPosition, setDestinationPosition] = useState<[number, number] | null>(
    destinationCoordinates ?? null
  );
  
  const [eta, setEta] = useState<number>(12);
  const destinationAddress = (delivery as any).order?.delivery_address ?? (delivery as any).delivery_address ?? orderAddress;

  // Sync agent position from props
  useEffect(() => {
    if (delivery.current_lat && delivery.current_lng) {
      setCurrentPosition([delivery.current_lat, delivery.current_lng]);
    }
  }, [delivery.current_lat, delivery.current_lng]);

  // Sync destination or compute fallback
  useEffect(() => {
    if (destinationCoordinates && destinationCoordinates[0] && destinationCoordinates[1]) {
      setDestinationPosition(destinationCoordinates);
    } else if (!destinationPosition && currentPosition[0] !== 0) {
      setDestinationPosition(computeDestinationPosition(currentPosition, destinationAddress));
    }
  }, [currentPosition, destinationAddress, destinationCoordinates]);

  // Auto-Geolocation context helper
  useEffect(() => {
    if (currentPosition[0] === 0 && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentPosition([latitude, longitude]);
        if (!destinationPosition) {
          setDestinationPosition(computeDestinationPosition([latitude, longitude], destinationAddress));
        }
      });
    }
  }, [currentPosition, destinationPosition, destinationAddress]);

  // Movement Simulation
  useEffect(() => {
    if (!simulateMovement || currentPosition[0] === 0 || !destinationPosition) return;
    const interval = setInterval(() => {
      setCurrentPosition(prev => {
        const [lat, lng] = prev;
        const target = destinationPosition;
        const step = 0.00015;
        const dLat = target[0] - lat;
        const dLng = target[1] - lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        
        if (dist < 0.0008) {
          setEta(1); 
          return prev;
        }

        const nextLat = lat + (dLat / dist) * step;
        const nextLng = lng + (dLng / dist) * step;
        
        onLocationUpdate(nextLat, nextLng);
        setEta(Math.max(2, Math.floor(dist * 1200)));
        return [nextLat, nextLng];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [simulateMovement, destinationPosition, onLocationUpdate, currentPosition]);

  if (currentPosition[0] === 0) {
    return (
      <div className="h-96 rounded-[2.5rem] bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-gray-400">Locating real-time delivery point...</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Ensure finalDestination is defined before return
  const finalDestination = destinationPosition || [currentPosition[0], currentPosition[1]];

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] bg-gray-100 border border-gray-100 shadow-inner">
      <div className="absolute top-6 left-6 z-[1000] flex gap-3 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Estimated Arrival</p>
          <p className="text-xl font-black text-gray-900 leading-none">{eta} mins</p>
        </div>
        <div className="bg-blue-600 px-5 py-3 rounded-2xl shadow-xl shadow-blue-200 flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <p className="text-xs font-bold text-white whitespace-nowrap">Live Tracking Active</p>
        </div>
      </div>

      <div className="h-[450px] w-full">
        <MapContainer
          center={currentPosition}
          zoom={16}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          
          <Polyline 
            positions={[currentPosition, finalDestination]} 
            pathOptions={{ 
              color: '#3B82F6', 
              weight: 6, 
              opacity: 0.3, 
              lineCap: 'round',
              dashArray: '1, 12'
            }} 
          />
          
          <Marker position={currentPosition} icon={bikeIcon}>
            <Popup className="custom-popup">
              <div className="p-1">
                <p className="text-xs font-black text-gray-400 uppercase tracking-tighter mb-1">Agent Position</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">🛵</div>
                  <p className="text-sm font-bold text-gray-900">Out for delivery</p>
                </div>
              </div>
            </Popup>
          </Marker>

          <Marker position={finalDestination} icon={destinationIcon}>
            <Popup className="custom-popup">
              <div className="p-1">
                <p className="text-xs font-black text-gray-400 uppercase tracking-tighter mb-1">Destination</p>
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{destinationAddress ?? 'Delivery Point'}</p>
              </div>
            </Popup>
          </Marker>

          <MapBoundsUpdater positions={[currentPosition, finalDestination]} />
        </MapContainer>
      </div>

      <style jsx global>{`
        .destination-pulse {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .main-marker {
          font-size: 24px;
          z-index: 2;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }
        .pulse-ring {
          position: absolute;
          width: 40px;
          height: 40px;
          background: rgba(239, 68, 68, 0.2);
          border-radius: 50%;
          animation: map-pulse 2s infinite;
        }
        @keyframes map-pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        .leaflet-container {
          cursor: grab !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 1rem !important;
          border: none !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
        }
        .custom-popup .leaflet-popup-content {
          margin: 12px !important;
        }
      `}</style>
    </div>
  );
}