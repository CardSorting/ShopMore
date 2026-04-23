/**
 * [LAYER: INFRASTRUCTURE]
 */
import type { IPaymentProcessor } from '@domain/repositories';

export class MockPaymentProcessor implements IPaymentProcessor {
  async processPayment(params: {
    amount: number;
    orderId: string;
  }): Promise<{ success: boolean; transactionId: string | null }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Deterministic mock: always succeeds for demo
    const transactionId = `mock_${params.orderId}_${Date.now()}`;

    return {
      success: true,
      transactionId,
    };
  }
}