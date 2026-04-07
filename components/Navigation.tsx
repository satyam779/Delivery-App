'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [state.user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'CLEAR_CART' });
    setIsMenuOpen(false);
    router.push('/');
  };

  const cartItemCount = state.cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex min-h-16 items-center justify-between py-3 md:py-0">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex items-center gap-3 text-lg font-bold text-black sm:text-xl">
              <Image
                src="/favicon.ico"
                alt="Delivery App logo"
                width={36}
                height={36}
                className="rounded-md"
              />
              <span>Delivery App</span>
            </Link>
            <div className="hidden items-baseline space-x-2 md:ml-6 md:flex">
              <Link href="/products" className="rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-gray-100">
                Products
              </Link>
              {state.user && (
                <Link href="/orders" className="rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-gray-100">
                  Orders
                </Link>
              )}
              {state.user?.role === 'admin' && (
                <Link href="/admin" className="rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-gray-100">
                  Admin
                </Link>
              )}
              {state.user?.role === 'agent' && (
                <Link href="/agent" className="rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-gray-100">
                  Agent Portal
                </Link>
              )}
            </div>
          </div>
          <div className="hidden items-center space-x-3 md:flex">
            {state.user ? (
              <>
                <Link href="/cart" className="relative rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-gray-100">
                  Cart
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                <span className="max-w-48 truncate text-sm text-black">Welcome, {state.user.email}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-gray-100">
                  Login
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-black shadow-sm md:hidden"
          >
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
        {isMenuOpen && (
          <div className="absolute right-4 top-[72px] z-30 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-orange-100 bg-white p-3 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.45)] md:hidden sm:right-6">
            <div className="flex flex-col gap-2">
              <Link
                href="/products"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-black transition hover:bg-orange-100"
              >
                Products
              </Link>
              {state.user && (
                <Link
                  href="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-black transition hover:bg-orange-100"
                >
                  Orders
                </Link>
              )}
              {state.user?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-black transition hover:bg-orange-100"
                >
                  Admin
                </Link>
              )}
              {state.user?.role === 'agent' && (
                <Link
                  href="/agent"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-black transition hover:bg-orange-100"
                >
                  Agent Portal
                </Link>
              )}
              {state.user ? (
                <>
                  <Link
                    href="/cart"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-black transition hover:bg-orange-100"
                  >
                    Cart {cartItemCount > 0 ? `(${cartItemCount})` : ''}
                  </Link>
                  <div className="rounded-xl border border-orange-100 px-4 py-3 text-sm text-black break-all">
                    Welcome, {state.user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl bg-black px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-black transition hover:bg-orange-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
