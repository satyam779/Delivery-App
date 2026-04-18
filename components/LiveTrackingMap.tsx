'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Delivery } from '@/lib/types';

// ✨ Premium Animations & Icons
const createBikeIcon = (rotation: number) => L.divIcon({
  html: `<div class="bike-container" style="transform: rotate(${rotation}deg);">
          <div class="bike-glow"></div>
          <img src="https://cdn-icons-png.flaticon.com/512/4845/4845772.png" class="bike-img" />
        </div>`,
  className: 'custom-bike-icon',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const destinationIcon = L.divIcon({
  html: `<div class="destination-pin-root">
          <div class="pin-icon">📍</div>
          <div class="pin-shadow"></div>
          <div class="pulse-wave"></div>
        </div>`,
  className: 'custom-destination-icon',
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// 🎥 Smart Cinematic Camera Controller
function MapCameraController({ agentPos, destinationPos, route }: { agentPos: [number, number], destinationPos: [number, number] | null, route: [number, number][] }) {
  const map = useMap();
  const lastKey = useRef("");

  useEffect(() => {
    map.invalidateSize();
    
    // Create a key to avoid continuous re-fitting if nothing meaningful changed
    const key = `${agentPos[0]},${agentPos[1]}-${destinationPos?.[0]}-${destinationPos?.[1]}`;
    if (key === lastKey.current) return;

    if (agentPos[0] !== 0 && destinationPos && destinationPos[0] !== 0) {
      const bounds = L.latLngBounds([
        agentPos,
        destinationPos
      ]);
      
      // Extend bounds to include the route path if it exists
      if (route.length > 0) {
        route.forEach(p => {
          if (p[0] !== 0) bounds.extend(p);
        });
      }
      
      map.fitBounds(bounds, { 
        padding: [100, 100], 
        animate: true,
        maxZoom: 15
      });
      lastKey.current = key;
    }
  }, [agentPos, destinationPos, route, map]);

  return null;
}

export default function LiveTrackingMap({
  delivery,
  orderAddress,
  destinationCoordinates,
  simulateMovement = false,
  onLocationUpdate,
}: {
  delivery: Delivery;
  orderAddress?: string;
  destinationCoordinates?: [number, number];
  simulateMovement?: boolean;
  onLocationUpdate: (lat: number, lng: number) => void;
}) {
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(() => {
    if (delivery.current_lat && delivery.current_lng) return [delivery.current_lat, delivery.current_lng];
    if (destinationCoordinates && destinationCoordinates[0] !== 0) return [destinationCoordinates[0] - 0.002, destinationCoordinates[1] - 0.002];
    return [12.9716, 77.5946]; // Default to center if unknown
  });

  const destinationPosition = useMemo<[number, number] | null>(() => {
    if (destinationCoordinates && destinationCoordinates[0] !== 0) return destinationCoordinates;
    return null;
  }, [destinationCoordinates]);

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [eta, setEta] = useState<number>(12);
  const [distance, setDistance] = useState<string>('0.0');
  const [rotation, setRotation] = useState(0);

  const destinationAddress = (delivery as any).order?.delivery_address ?? (delivery as any).delivery_address ?? orderAddress;

  const calculateBearing = (start: [number, number], end: [number, number]) => {
    const startLat = start[0] * (Math.PI / 180);
    const startLng = start[1] * (Math.PI / 180);
    const endLat = end[0] * (Math.PI / 180);
    const endLng = end[1] * (Math.PI / 180);
    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    return ((Math.atan2(y, x) * (180 / Math.PI) + 360) % 360);
  };

  // Helper for direct distance calculation (Haversine) as fallback
  const getDirectDistance = (p1: [number, number], p2: [number, number]) => {
    return L.latLng(p1).distanceTo(p2) / 1000;
  };

  const lastFetchRef = useRef<{ lat: number, lng: number, time: number } | null>(null);

  useEffect(() => {
    // 🧠 ROUTE INTELLIGENCE: 
    // Only fetch driving route if we don't have one, or if we've moved significantly.
    // We NEVER downgrade from a road-route (many points) back to a straight line.
    const fetchRoute = async (retries = 2) => {
      if (simulateMovement || currentPosition[0] === 0 || !destinationPosition) return;
      
      const now = Date.now();
      const hasRoadRoute = routeCoordinates.length > 2;
      
      if (lastFetchRef.current) {
        const distMoved = L.latLng(currentPosition).distanceTo([lastFetchRef.current.lat, lastFetchRef.current.lng]);
        const timePassed = now - lastFetchRef.current.time;
        const threshold = hasRoadRoute ? 300 : 50; 
        if (distMoved < threshold && timePassed < 15000) return;
      }

      try {
        // 🛰️ ULTRA-RESILIENT FETCH: Added radiuses=5000 to snap to roads even if coordinates are slightly off-road
        const url = `https://router.project-osrm.org/route/v1/driving/${currentPosition[1]},${currentPosition[0]};${destinationPosition[1]},${destinationPosition[0]}?overview=full&geometries=geojson&radiuses=5000;5000`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error(`OSRM Error: ${res.status}`);
        
        const data = await res.json();
        
        if (data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setRouteCoordinates(coords);
          
          let distKm = data.routes[0].distance / 1000;
          if (distKm < 0.1) distKm = getDirectDistance(currentPosition, destinationPosition) * 1.2;
          
          setDistance(distKm.toFixed(1));
          setEta(Math.ceil(distKm * 4) + 2);
          lastFetchRef.current = { lat: currentPosition[0], lng: currentPosition[1], time: now };
        } else if (retries > 0) {
          // Retry with even larger radius if failed
          setTimeout(() => fetchRoute(retries - 1), 2000);
        }
      } catch (err) {
        if (retries > 0) {
           setTimeout(() => fetchRoute(retries - 1), 3000);
           return;
        }
        
        if (routeCoordinates.length === 0) {
          const directDist = getDirectDistance(currentPosition, destinationPosition) * 1.3;
          setDistance(directDist.toFixed(1));
          setEta(Math.ceil(directDist * 4) + 2);
          setRouteCoordinates([currentPosition, destinationPosition]);
        }
      }
    };
    fetchRoute();
  }, [currentPosition, destinationPosition, simulateMovement]);

  useEffect(() => {
    if (delivery.current_lat && delivery.current_lng) {
      setCurrentPosition([delivery.current_lat, delivery.current_lng]);
    }
  }, [delivery.current_lat, delivery.current_lng]);

  // 🏎️ CONTINUOUS UPDATES: Real GPS Tracking with zero caching
  useEffect(() => {
    if (simulateMovement || !navigator.geolocation) return;

    let lastUpdateAt = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading } = pos.coords;
        const now = Date.now();

        // Update local map position immediately for agent
        setCurrentPosition(prev => {
          if (prev[0] !== 0) {
            const newRotation = calculateBearing(prev, [latitude, longitude]);
            if (newRotation !== 0) setRotation(newRotation);
          }
          return [latitude, longitude];
        });

        // Throttle database updates slightly to 800ms for stability but high accuracy
        if (now - lastUpdateAt > 800) {
          onLocationUpdate(latitude, longitude);
          lastUpdateAt = now;
        }
      },
      (err) => console.warn('Real-time tracking error:', err),
      {
        enableHighAccuracy: true,
        maximumAge: 0, // Force fresh location every second
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [simulateMovement, onLocationUpdate]);

  // 🏎️ Ultra-Smooth Glide Movement (SIMULATION MODE)
  useEffect(() => {
    if (!simulateMovement || currentPosition[0] === 0 || routeCoordinates.length < 2) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < routeCoordinates.length - 1) {
        index++;
        const p1 = routeCoordinates[index - 1];
        const p2 = routeCoordinates[index];
        setRotation(calculateBearing(p1, p2));

        setCurrentPosition(p2);
        onLocationUpdate(p2[0], p2[1]);
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [simulateMovement, routeCoordinates, onLocationUpdate]);

  if (currentPosition[0] === 0) {
    return (
      <div className="h-[550px] rounded-[3.5rem] bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 shadow-inner">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Calibrating GPS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group overflow-hidden rounded-[3.5rem] bg-white border-8 border-white shadow-[0_45px_100px_-25px_rgba(0,0,0,0.2)] mt-8">
      {/* 🚀 Dynamic Premium HUD */}
      <div className="absolute top-3 md:top-8 left-3 md:left-8 right-3 md:right-8 z-[1000] flex flex-col sm:flex-row justify-between gap-3 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-2xl px-4 md:px-6 py-3 md:py-5 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-white/40 flex items-center gap-3 md:gap-5 transition-transform group-hover:scale-105 duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
            <div className="relative w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl md:rounded-3xl flex items-center justify-center text-xl md:text-2xl shadow-xl">🛵</div>
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] font-black text-blue-500/60 uppercase tracking-widest leading-none mb-1 md:mb-2 text-nowrap">Live Tracking</p>
            <div className="flex items-center gap-2 md:gap-3">
              <span className="flex h-2 w-2 md:h-3 md:w-3">
                <span className="animate-ping absolute inline-flex h-2 w-2 md:h-3 md:w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-green-500"></span>
              </span>
              <p className="text-sm md:text-lg font-black text-slate-900 leading-none">Driver En Route</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl px-5 md:px-8 py-3 md:py-5 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex items-center gap-4 md:gap-8 border border-slate-800">
            <div className="text-center">
              <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 md:mb-2">ETA</p>
              <p className="text-lg md:text-2xl font-black text-white leading-none">{eta}<span className="text-[10px] ml-1 text-slate-400 italic">MIN</span></p>
            </div>
            <div className="w-[1px] h-6 md:h-10 bg-slate-700"></div>
            <div className="text-center">
              <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Distance</p>
              <p className="text-lg md:text-2xl font-black text-white leading-none">{distance}<span className="text-[10px] ml-1 text-slate-400 italic">KM</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[450px] md:h-[600px] w-full relative">
        <MapContainer
          center={currentPosition}
          zoom={16}
          zoomControl={true}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />

          {routeCoordinates.length > 0 && (
            <>
              <Polyline
                positions={routeCoordinates}
                pathOptions={{ color: '#3B82F6', weight: 10, opacity: 0.1, lineCap: 'round' }}
              />
              <Polyline
                positions={routeCoordinates}
                pathOptions={{ color: '#2563EB', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round', dashArray: '1, 15', dashOffset: '10' }}
                className="animated-route"
              />
            </>
          )}

          <Marker position={currentPosition} icon={createBikeIcon(rotation)}>
            <Popup closeButton={false} className="ultra-popup">
              <div className="flex items-center gap-3 py-1">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-lg shadow-sm">🚀</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Status</p>
                  <p className="text-sm font-black text-slate-900 leading-none">Moving Fast</p>
                </div>
              </div>
            </Popup>
          </Marker>

          {destinationPosition && (
            <Marker position={destinationPosition} icon={destinationIcon}>
              <Popup closeButton={false} className="ultra-popup">
                <div className="text-center py-1">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Delivery At</p>
                  <p className="text-sm font-bold text-slate-700 leading-snug">{destinationAddress ?? 'Destination Point'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          <MapCameraController
            agentPos={currentPosition}
            destinationPos={destinationPosition}
            route={routeCoordinates}
          />
        </MapContainer>
      </div>

      <style jsx global>{`
        .bike-container {
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .bike-img {
          width: 52px;
          height: 52px;
          filter: drop-shadow(0 8px 15px rgba(37, 99, 235, 0.3));
          z-index: 2;
        }
        .bike-glow {
          position: absolute;
          width: 40px;
          height: 40px;
          background: #3B82F6;
          filter: blur(15px);
          opacity: 0.3;
          border-radius: 50%;
        }
        
        .destination-pin-root {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateY(-15px);
        }
        .pin-icon {
          font-size: 38px;
          z-index: 3;
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.4));
          animation: pin-bounce 2s infinite ease-in-out;
        }
        .pin-shadow {
          width: 25px;
          height: 8px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          filter: blur(4px);
          margin-top: -5px;
        }
        .pulse-wave {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 4px solid #3B82F6;
          border-radius: 50%;
          top: 0;
          animation: wave-spread 2s infinite;
          opacity: 0;
        }
        
        @keyframes pin-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes wave-spread {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        
        .animated-route {
          stroke-dasharray: 10, 15;
          animation: route-flow 45s linear infinite;
        }
        @keyframes route-flow {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        
        .ultra-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(15px) !important;
          border-radius: 2.5rem !important;
          border: none !important;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15) !important;
          padding: 8px 12px !important;
        }
        .leaflet-container { background: #f8fafc !important; }
      `}</style>
    </div>
  );
}