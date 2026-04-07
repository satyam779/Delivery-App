import { CartItem as CartItemType } from '@/lib/types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { product, quantity } = item;

  return (
    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div className="text-gray-400 text-xl">🍕</div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <p className="text-gray-600">${product.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
          className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center hover:bg-gray-300"
        >
          -
        </button>
        <span className="w-8 text-center">{quantity}</span>
        <button
          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
          className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center hover:bg-gray-300"
        >
          +
        </button>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">
          ${(product.price * quantity).toFixed(2)}
        </p>
        <button
          onClick={() => onRemove(product.id)}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>
    </div>
  );
}