/**
 * [LAYER: CORE]
 */
import type { IDiscountRepository } from '@domain/repositories';

export class DiscountService {
  constructor(private discountRepo: IDiscountRepository) {}

  async getAllDiscounts() {
    return this.discountRepo.getAll();
  }

  async createDiscount(data: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    status: 'active' | 'scheduled' | 'expired';
    startsAt: Date;
    endsAt?: Date;
  }) {
    return this.discountRepo.create(data);
  }

  async deleteDiscount(id: string) {
    return this.discountRepo.delete(id);
  }

  async updateDiscount(id: string, updates: any) {
    return this.discountRepo.update(id, updates);
  }

  async validateDiscount(code: string, cartTotal: number) {
    const discount = await this.discountRepo.getByCode(code);
    if (!discount) return { valid: false, message: 'Invalid discount code' };
    
    if (discount.status !== 'active') return { valid: false, message: 'This discount is not active' };
    
    const now = new Date();
    if (now < discount.startsAt) return { valid: false, message: 'This discount has not started yet' };
    if (discount.endsAt && now > discount.endsAt) return { valid: false, message: 'This discount has expired' };

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = Math.round(cartTotal * (discount.value / 100));
    } else {
      discountAmount = discount.value;
    }

    return {
      valid: true,
      discount,
      discountAmount: Math.min(discountAmount, cartTotal)
    };
  }
}
