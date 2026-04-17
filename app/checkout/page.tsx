'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/lib/supabase';

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
      if (apiError) throw new Error(apiError);

      setOrderSubmitted(true);
      dispatch({ type: 'CLEAR_CART' });
      router.replace(`/order-confirmation?order_id=${orderId}`);
    } catch (error: any) {
      alert('Order failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!state.user) {
      router.push('/login');
      return;
    }
  }, [state.user, router]);

  if (state.cart.length === 0 && !orderSubmitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4 font-bold">Your cart is empty</p>
        <button onClick={() => router.push('/')} className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold">Start Shopping</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Checkout</h1>
        <p className="text-gray-500 mt-2 font-medium">Verify your details and complete the payment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div>
             <h2 className="text-xl font-bold mb-4 text-gray-800">Delivery Address</h2>
             
             {/* Enhanced GPS Section */}
             <div className={`mb-6 p-6 rounded-[2rem] border-2 transition-all ${
               deliveryLocation 
                 ? 'bg-green-50 border-green-200' 
                 : 'bg-indigo-50 border-indigo-100'
             }`}>
               <div className="flex items-center gap-3 mb-4">
                 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                   deliveryLocation ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'
                 }`}>
                   {deliveryLocation ? '✅' : '📍'}
                 </div>
                 <div>
                   <p className="font-bold text-gray-900">
                     {deliveryLocation ? 'Real location captured' : 'Step 1: Capture GPS'}
                   </p>
                   {deliveryLocation ? (
                     <p className="text-[10px] text-green-600 font-black uppercase tracking-widest leading-none">High Accuracy Link Ready</p>
                   ) : (
                     <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest leading-none">Essential for Live Tracking</p>
                   )}
                 </div>
               </div>

               {deliveryLocation ? (
                 <div className="bg-white/60 p-3 rounded-xl border border-green-100 flex items-center justify-between">
                   <p className="text-xs text-green-700 font-black font-mono">
                     LOC: {deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}
                   </p>
                   <button 
                     onClick={() => setDeliveryLocation(null)}
                     className="text-[10px] font-black text-red-500 hover:text-red-700 underline"
                   >
                     Reset
                   </button>
                 </div>
               ) : (
                 <button
                   type="button"
                   onClick={() => {
                     if (!navigator.geolocation) {
                       setLocationStatus('GPS not supported');
                       return;
                     }
                     setLocationStatus('Locating you...');
                     navigator.geolocation.getCurrentPosition(
                       (pos) => {
                         const lat = pos.coords.latitude;
                         const lng = pos.coords.longitude;
                         setDeliveryLocation({ lat, lng });
                         setLocationStatus('');
                         if (!address) setAddress(`GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                       },
                       (err) => setLocationStatus(`Error: ${err.message}`),
                       { enableHighAccuracy: true }
                     );
                   }}
                   className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98]"
                 >
                   {locationStatus ? locationStatus : '🌐 Detect My Current Location'}
                 </button>
               )}
             </div>

             <textarea
               value={address}
               onChange={(e) => setAddress(e.target.value)}
               placeholder="Enter detailed delivery address (e.g. House No, Area, Landmark)"
               className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm h-32"
               required
             />
             {!deliveryLocation && (
               <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                 <span className="text-xl">⚠️</span>
                 <p className="text-xs text-amber-900 font-bold leading-relaxed">
                   Without GPS capture, tracking will be limited. Please use the button above.
                 </p>
               </div>
             )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Payment Method</h2>
            <div className="bg-gray-50 rounded-[2.5rem] border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-none">UPI Payment</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Unified Payments Interface</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Merchant UPI ID</p>
                    <div className="flex items-center gap-2">
                       <code className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-gray-800 break-all">{upiId}</code>
                       <button onClick={copyUpiId} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">📋</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Scan the code with PhonePe, Google Pay, or Paytm and click pay. Then complete your order below.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                  <img
                    src={qrImageUrl}
                    onError={() => setQrImageUrl(qrCodeUrl)}
                    alt="Scan to Pay"
                    className="w-32 h-32 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800">Order Summary</h2>
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sticky top-10">
            <div className="space-y-4 mb-8">
              {state.cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 leading-none">{item.product.name}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Quantity {item.quantity}</p>
                  </div>
                  <span className="font-black text-gray-900">{formatCurrency(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-50 pt-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Delivery</span>
                <span className="font-bold text-gray-500">{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-xs font-black uppercase tracking-tighter text-gray-900">Final Total</span>
                <span className="text-3xl font-black text-gray-900">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full mt-8 bg-black text-white font-black py-5 rounded-3xl hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing Order...</span>
                </div>
              ) : 'Complete Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
