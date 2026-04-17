'use client';

import ProductList from '@/components/ProductList';

export default function GroceryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black text-black mb-4 tracking-tight">Grocery Store</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Fresh essentials delivered to your doorstep. From farm-fresh produce to daily staples.
        </p>
      </div>
      
      <div className="bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.05),_transparent_40%)] min-h-screen">
        <ProductList category="Grocery" />
      </div>
    </div>
  );
}
