'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Delivery } from '@/lib/types';

const bikeIcon = L.icon({
  iconUrl: '/bike-marker.png',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
});

const destinationIcon = L.icon({
  iconUrl: '/destination-marker.svg',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
});

function computeDestinationPosition(center: [number, number], address?: string): [number, number] {
  const offset = 0.006;
  if (!address) {
    return [center[0] + offset, center[1] + offset];
  }

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
    if (positions && positions.length > 0) {
      map.fitBounds(positions as any, { padding: [50, 50] });
    }
  }, [positions, map]);

  return null;
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  const initialPosition: [number, number] = [
    delivery.current_lat ?? 12.9716,
    delivery.current_lng ?? 77.5946,
  ];

  const [currentPosition, setCurrentPosition] = useState<[number, number]>(initialPosition);
  const [destinationPosition, setDestinationPosition] = useState<[number, number] | null>(
    destinationCoordinates ?? null
  );

  const destinationAddress = delivery.order?.delivery_address ?? orderAddress;

  useEffect(() => {
    if (delivery.current_lat && delivery.current_lng) {
      setCurrentPosition([delivery.current_lat, delivery.current_lng]);
    }
  }, [delivery.current_lat, delivery.current_lng]);

  useEffect(() => {
    if (destinationCoordinates) {
      setDestinationPosition(destinationCoordinates);
      return;
    }

    if (!destinationPosition && currentPosition) {
      setDestinationPosition(
        computeDestinationPosition(currentPosition, destinationAddress)
      );
    }
  }, [currentPosition, destinationAddress, destinationCoordinates, destinationPosition]);

  useEffect(() => {
    if (!simulateMovement) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentPosition((prev) => {
        const [lat, lng] = prev;
        const newLat = lat + (Math.random() - 0.5) * 0.0002;
        const newLng = lng + (Math.random() - 0.5) * 0.0002;
        onLocationUpdate(newLat, newLng);
        return [newLat, newLng];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [onLocationUpdate, simulateMovement]);

  useEffect(() => {
    if (!delivery.current_lat || !delivery.current_lng) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition([latitude, longitude]);
            onLocationUpdate(latitude, longitude);
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }
    }
  }, [delivery.current_lat, delivery.current_lng, onLocationUpdate]);

  const finalDestination = destinationPosition ?? computeDestinationPosition(currentPosition, destinationAddress);

  return (
    <div className="h-96 rounded-lg overflow-hidden">
      <MapContainer
        center={currentPosition}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={currentPosition} icon={bikeIcon}>
          <Popup>
            <div>
              <p><strong>Delivery Agent</strong></p>
              <p>Order: {delivery.order_id.slice(-8)}</p>
              <p>Status: {delivery.status}</p>
            </div>
          </Popup>
        </Marker>
        <Marker position={finalDestination} icon={destinationIcon}>
          <Popup>
            <div>
              <p><strong>Delivery Destination</strong></p>
              <p>{destinationAddress ?? 'Customer location'}</p>
            </div>
          </Popup>
        </Marker>
        <Polyline positions={[currentPosition, finalDestination]} pathOptions={{ color: 'blue', weight: 3, opacity: 0.6 }} />
        <MapBoundsUpdater positions={[currentPosition, finalDestination]} />
      </MapContainer>
    </div>
  );
}