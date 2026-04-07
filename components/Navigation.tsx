'use client';

import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Navigation() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          dispatch({
            type: 'SET_USER',
            payload: {
              id: user.id,
              email: user.email!,
              role: user.user_metadata?.role || 'customer',
            },
          });
        }
      } catch (error) {
        console.warn('Failed to initialize auth user:', error);
      }
    };
    getUser();

    const { data } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (session?.user) {
        dispatch({
          type: 'SET_USER',
          payload: {
            id: session.user.id,
            email: session.user.email!,
            role: session.user.user_metadata?.role || 'customer',
          },
        });
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    });

    return () => data?.subscription?.unsubscribe?.();
  }, [dispatch]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'CLEAR_CART' });
    router.push('/');
  };

  const cartItemCount = state.cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Delivery App
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Products
              </Link>
              {state.user && (
                <Link href="/orders" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Orders
                </Link>
              )}
              {state.user?.role === 'admin' && (
                <Link href="/admin" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Admin
                </Link>
              )}
              {state.user?.role === 'agent' && (
                <Link href="/agent" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Agent Portal
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {state.user ? (
              <>
                <Link href="/cart" className="relative text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Cart
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                <span className="text-gray-600 text-sm">Welcome, {state.user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}