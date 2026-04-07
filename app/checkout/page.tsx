'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';

type LocationState = {
  lat: number;
  lng: number;
};

export default function CheckoutPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<LocationState | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const total = state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = 2.99;
  const finalTotal = total + deliveryFee;
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'your-vpa@okbizaxis';
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Delivery App')}&am=${finalTotal.toFixed(2)}&cu=INR`;
  const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(upiLink)}`;
  const [qrImageUrl, setQrImageUrl] = useState('/upi-qr.png');

  const copyUpiId = async () => {
    await navigator.clipboard.writeText(upiId);
    alert('UPI ID copied to clipboard');
  };

  const handleCheckout = async () => {
    if (!address.trim()) {
      alert('Please enter a delivery address');
      return;
    }

    setLoading(true);

    try {
      const userId = state.user?.id;
      if (!userId) {
        throw new Error('User must be logged in to checkout');
      }

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: state.cart,
          deliveryAddress: address,
          deliveryLat: deliveryLocation?.lat,
          deliveryLng: deliveryLocation?.lng,
          totalAmount: finalTotal,
          userId,
        }),
      });

      const { orderId, error: apiError } = await response.json();
      if (apiError) {
        throw new Error(apiError);
      }

      setOrderSubmitted(true);
      dispatch({ type: 'CLEAR_CART' });
      router.replace(`/order-confirmation?order_id=${orderId}`);
    } catch (error: any) {
      alert('Payment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    if (!state.user) {
      router.push('/login');
      return;
    }

    if (orderSubmitted) {
      setRedirecting(false);
      return;
    }

    if (!loading && state.cart.length === 0) {
      router.push('/cart');
      return;
    }

    setRedirecting(false);
  }, [loading, orderSubmitted, state.user, state.cart, router]);

  if (redirecting) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
          <textarea
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setDeliveryLocation(null);
              setLocationStatus('');
            }}
            placeholder="Enter your delivery address"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            required
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  setLocationStatus('Geolocation is not supported by your browser.');
                  return;
                }

                setLocationStatus('Locating...');
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setDeliveryLocation({ lat, lng });
                    setAddress(`Live location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                    setLocationStatus('Live delivery location captured.');
                  },
                  (error) => {
                    setLocationStatus(`Failed to capture your location: ${error.message}`);
                  },
                  { enableHighAccuracy: true }
                );
              }}
              className="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
            >
              Use my live location
            </button>
            {locationStatus && (
              <p className="text-sm text-gray-600">{locationStatus}</p>
            )}
          </div>
          {deliveryLocation && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-200 text-sm text-slate-700">
              Delivery coordinates captured: {deliveryLocation.lat.toFixed(6)}, {deliveryLocation.lng.toFixed(6)}
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4 mt-8">Payment Method</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-gray-700 font-semibold mb-2">Pay with UPI</p>
            <p className="text-sm text-gray-600 mb-3">
              Scan the QR code or copy the UPI ID into your payment app to complete payment.
            </p>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-start">
              <div>
                <p className="text-sm font-medium text-gray-900">UPI ID</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="font-mono text-sm text-gray-800 break-all">{upiId}</span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="rounded bg-blue-600 text-white px-3 py-1 text-sm hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  If you place a QR image file named <span className="font-semibold">/public/upi-qr.png</span>, it will be used here.
                </p>
              </div>
              <img
                src={qrImageUrl}
                onError={() => setQrImageUrl(qrCodeUrl)}
                alt="UPI QR Code"
                className="w-40 h-40 rounded-md border border-gray-300 bg-white object-contain"
              />
            </div>
            <p className="text-sm text-gray-500 mt-3">
              After you pay using your UPI app, click Complete Order to confirm the order in the app.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            {state.cart.map((item) => (
              <div key={item.product.id} className="flex justify-between mb-2">
                <span>{item.product.name} x{item.quantity}</span>
                <span>{formatCurrency(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Complete Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
