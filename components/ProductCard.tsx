import Image from 'next/image';
import { formatCurrency } from '@/lib/currency';
import { Product } from '@/lib/types';
import { getProductImageUrl } from '@/lib/product-images';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  cartQuantity,
  onUpdateQuantity,
}: ProductCardProps) {
  const imageUrl = getProductImageUrl(product);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gray-200">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        {product.description && (
          <p className="text-gray-600 text-sm mb-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
          {cartQuantity > 0 ? (
            <div className="flex items-center rounded-md border border-blue-600 overflow-hidden">
              <button
                onClick={() => onUpdateQuantity(product.id, cartQuantity - 1)}
                className="bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                -
              </button>
              <span className="min-w-10 px-3 text-center text-sm font-semibold text-black">
                {cartQuantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(product.id, cartQuantity + 1)}
                className="bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
