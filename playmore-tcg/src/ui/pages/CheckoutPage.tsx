/**
 * [LAYER: UI]
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';

function CheckoutPage() {
  const { user } = useAuth();
  const services = useServices();
  
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
  });
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  async function handlePlaceOrder() {
    if (!user) return;
    setPlacing(true);
    try {
      const order = await services.orderService.placeOrder(user.id, address);
      setOrderId(order.id);
      setStep('success');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
        <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
        <p className="text-sm font-mono text-gray-400 mb-6">Order #{orderId.slice(0, 16)}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/orders" className="bg-primary-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary-700">
            View Orders
          </Link>
          <Link to="/products" className="bg-white border text-gray-700 px-6 py-2.5 rounded-md font-medium hover:bg-gray-50">
            Keep Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/cart" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">1</span>
            Shipping Address
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              placeholder="Street Address"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
              <input
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="ZIP"
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
              <input
                placeholder="Country"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">2</span>
            Payment (Mock)
          </h2>
          <div className="bg-gray-50 rounded-md p-4 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-700">Mock Payment Processor</p>
              <p className="text-xs text-gray-400">No real card required. Simulated for demo.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={placing || !address.street || !address.city || !address.state || !address.zip}
          className="w-full bg-primary-600 text-white py-3 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {placing ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}