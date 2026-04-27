'use client';

import { useEffect, useState, use } from 'react';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import type { Order } from '@domain/models';
import { OrderConfirmation } from '../checkout/OrderConfirmation';
import { logger } from '@utils/logger';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const services = useServices();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!user) return;
      try {
        const result = await services.orderService.getOrder(id);
        if (result) {
          setOrder(result);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        logger.error('Failed to load order', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id, services.orderService, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl text-center border border-gray-100">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-500 mb-8 font-medium">{error || "We couldn't find the order you're looking for."}</p>
          <Link href="/orders" className="inline-flex items-center gap-2 text-primary-600 font-black hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to orders
          </Link>
        </div>
      </div>
    );
  }

  return <OrderConfirmation order={order} userEmail={user?.email || ''} userName={user?.displayName} />;
}
