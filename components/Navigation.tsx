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
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          // If refresh token is invalid/not found, force a clean state
          if (error.message.includes('Refresh Token') || error.status === 401) {
            console.warn('Session expired or invalid, signing out...');
            await supabase.auth.signOut();
            dispatch({ type: 'SET_USER', payload: null });
            return;
          }
          throw error;
        }

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
        console.warn('Auth initialization skipped:', error);
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
                Menu
              </Link>
              <Link href="/grocery" className="rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-gray-100">
                Grocery
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
          {/* 💻 DESKTOP AUTH & KART: Unified layout */}
          <div className="hidden items-center gap-4 md:flex">
            {state.user ? (
              <div className="flex items-center gap-3">
                {/* Kart moves to the left of auth info */}
                <Link href="/cart" className="group relative flex items-center justify-center p-2 rounded-xl transition-all hover:bg-slate-100">
                  <svg className="w-6 h-6 text-slate-700 transition-colors group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm transform translate-x-1 -translate-y-1">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                <div className="h-8 w-[1px] bg-slate-200"></div>

                <div className="flex flex-col items-start px-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                  <span className="max-w-32 truncate text-xs font-bold text-slate-900 leading-none">{state.user.email}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 uppercase tracking-widest"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link href="/login" className="text-xs font-black text-slate-900 hover:text-blue-600 transition-colors uppercase tracking-widest">
                  Login
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white text-[10px] font-black px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 uppercase tracking-widest">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* 📱 MOBILE KART + MENU TOGGLE */}
          <div className="flex items-center gap-2 md:hidden">
            {state.user && (
              <Link href="/cart" className="group relative flex items-center justify-center p-2 rounded-xl transition-all hover:bg-slate-100">
                <svg className="w-6 h-6 text-slate-700 transition-colors group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm transform translate-x-1 -translate-y-1">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-black px-4 py-2 text-[10px] font-black text-white hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest"
            >
              {isMenuOpen ? 'X' : 'Sign Up'}
            </button>
          </div>
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
              <Link
                href="/grocery"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-black transition hover:bg-orange-100"
              >
                Grocery
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
