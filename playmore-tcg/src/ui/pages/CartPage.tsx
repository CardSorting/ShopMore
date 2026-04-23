/**
 * [LAYER: UI]
 */
import { useEffect, useState } from 'react';
import { useServices } from '../hooks/useServices';
import type { Product } from '@domain/models';
import { Trash2, ChevronRight } from 'lucide-react';

export function CartPage() {
  const services = useServices();
  const [cart, setCart] = useState<{
    id: string;
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    updatedAt: Date;
  } | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});

  useEffect(() => {
    async function loadCart() {
      try {
        // Get current user
        const authServices = getInitialServices();
        const user = await authServices.authService.getUser();
        if (!user) {
          setCart(null);
          return;
        }

        // Load cart
        const userCart = await services.cartService.getByUserId(user.id);
        setCart(userCart);
      } catch (err) {
        console.error('Failed to load cart:', err);
      }
    }
    loadCart();
  }, [services]);

  useEffect(() => {
    if (cart && cart.items.length > 0) {
      const loadProducts = async () => {
        const productIds = cart.items.map((item) => item.productId);
        const results = await Promise.all(
          productIds.map((id) => services.productService.getById(id))
        );
        const productMap: Record<string, Product> = {};
        results.forEach((product) => {
          if (product) {
            productMap[product.id] = product;
          }
        });
        setProducts(productMap);
      };
      loadProducts();
    }
  }, [cart, services]);

  const removeFromCart = async (productId: string) => {
    if (!cart) return;
    const updatedCart = {
      ...cart,
      items: cart.items.filter((item) => item.productId !== productId),
    };
    await services.cartService.save(updatedCart);
    setCart(updatedCart);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!cart || quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = {
      ...cart,
      items: cart.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ),
    };
    await services.cartService.save(updatedCart);
    setCart(updatedCart);
  };

  const total = cart
    ? cart.items.reduce((sum, item) => {
        const product = products[item.productId];
        return sum + (product?.price || 0) * item.quantity;
      }, 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cart && cart.items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const product = products[item.productId];
                if (!product) return null;

                return (
                  <div
                    key={item.productId}
                    className="bg-white rounded-lg shadow-sm border p-4 flex gap-4"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ${((product.price * item.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-3 py-1 border rounded hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-3 py-1 border rounded hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${(total / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>$5.99</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span>${((total + 599) / 100).toFixed(2)}</span>
                  </div>
                </div>
                <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition flex items-center justify-center gap-2">
                  Proceed to Checkout
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Your cart is empty</p>
            <Link to="/products" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}