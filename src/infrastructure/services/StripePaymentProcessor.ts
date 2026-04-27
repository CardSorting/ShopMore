import type { IPaymentProcessor } from '@domain/repositories';
import { PaymentFailedError } from '@domain/errors';

export class StripePaymentProcessor implements IPaymentProcessor {
  async processPayment(params: {
    amount: number;
    orderId: string;
    paymentMethodId?: string;
    idempotencyKey: string;
  }): Promise<{ success: boolean; transactionId: string | null }> {
    if (!params.paymentMethodId) {
      throw new PaymentFailedError('Payment method is required for real processing.');
    }

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      throw new PaymentFailedError(
        'Stripe processor is not configured. Set STRIPE_SECRET_KEY or configure CHECKOUT_ENDPOINT.'
      );
    }

    const body = new URLSearchParams();
    body.set('amount', String(Math.trunc(params.amount)));
    body.set('currency', 'usd');
    body.set('confirm', 'true');
    body.set('payment_method', params.paymentMethodId);
    body.set('confirmation_method', 'automatic');
    body.set('description', `PlayMoreTCG order ${params.orderId}`);
    body.set('metadata[orderId]', params.orderId);

    let response: Response;
    try {
      response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': params.idempotencyKey,
        },
        body: body.toString(),
      });
    } catch {
      throw new PaymentFailedError('Unable to reach Stripe payment service.');
    }

    const payload = await response.json().catch(() => null) as {
      id?: unknown;
      status?: unknown;
      last_payment_error?: { message?: unknown };
      error?: { message?: unknown };
    } | null;

    if (!response.ok) {
      const message = typeof payload?.error?.message === 'string'
        ? payload.error.message
        : 'Stripe payment request failed.';
      throw new PaymentFailedError(message);
    }

    const transactionId = typeof payload?.id === 'string' ? payload.id : null;
    const status = typeof payload?.status === 'string' ? payload.status : null;
    if (!transactionId || !status) {
      throw new PaymentFailedError('Stripe payment response was malformed.');
    }

    if (status === 'succeeded' || status === 'requires_capture') {
      return { success: true, transactionId };
    }

    const failureMessage = typeof payload?.last_payment_error?.message === 'string'
      ? payload.last_payment_error.message
      : `Stripe payment not completed (status: ${status}).`;
    throw new PaymentFailedError(failureMessage);
  }
}
