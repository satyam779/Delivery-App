import Link from 'next/link';

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">Home</p>
        <h1 className="mt-4 text-4xl font-bold text-black sm:text-5xl">Delivery App</h1>
        <p className="mt-4 max-w-2xl text-base text-gray-700 sm:text-lg">
          Order food, track deliveries, and manage your cart from one place.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="rounded-md bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Products
          </Link>
          <Link
            href="/cart"
            className="rounded-md border border-gray-300 px-6 py-3 text-center text-sm font-medium text-black hover:bg-gray-50"
          >
            View Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
