'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import ProductCard from './ProductCard';

const fallbackProducts: Product[] = [
  {
    id: '1',
    name: 'Egg Puff',
    description: 'Egg Puffs with cheese',
    price: 30,
    image_url: '',
    category: 'Puff',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Cool Drinks',
    description: 'Thumbs up, Sprite, Coke, Fanta',
    price: 20,
    image_url: '',
    category: 'Drinks',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Biryani',
    description: 'Chicken Biryani',
    price: 150,
    image_url: '',
    category: 'Burgers',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function applyProductCardImages(products: Product[]) {
  return products.map((product, index) =>
    index === 0
      ? { ...product, image_url: '/egg-puff.jpg' }
      : index === 1
      ? { ...product, image_url: '/coke.jpg' }
      : index === 2
      ? { ...product, image_url: '/biryani.jpg' }
      : index === 3
      ? { ...product, image_url: '/chicken burger.webp' }
      : index === 4
      ? { ...product, image_url: '/salad.avif' }
      : index === 5
      ? { ...product, image_url: '/pasta.jpg' }
      : product
  );
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');
  const { state, dispatch } = useApp();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setProducts(applyProductCardImages(data));
      } else {
        // No products found, use fallback
        setProducts(applyProductCardImages(fallbackProducts));
        setWarningMessage(
          'Unable to load products from Supabase. Showing sample products instead. Check your Supabase URL and anon key in .env.local and run supabase-schema.sql if needed.'
        );
      }
    } catch (error: unknown) {
      console.error('Error fetching products:', error);
      setProducts(applyProductCardImages(fallbackProducts));
      setWarningMessage(
        'Unable to load products from Supabase. Showing sample products instead. Check your Supabase URL and anon key in .env.local and run supabase-schema.sql if needed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity: 1 } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <>
      {warningMessage && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
          {warningMessage}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const cartQuantity =
            state.cart.find((item) => item.product.id === product.id)?.quantity ?? 0;

          return (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              cartQuantity={cartQuantity}
              onUpdateQuantity={updateQuantity}
            />
          );
        })}
      </div>
    </>
  );
}
