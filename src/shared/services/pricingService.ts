/**
 * DOOARS DAILY BASKET - OFFICIAL PRICING & LOGISTICS CALCULATION ENGINE
 *
 * Core Business Rules:
 * - Distance <= 5 km: ₹40 standard delivery charge
 * - Distance > 5 km: ₹40 + ₹15 × CEILING(distance − 5)
 *   Examples:
 *     5.0 km = ₹40
 *     5.1 km = ₹55
 *     6.0 km = ₹55
 *     6.1 km = ₹70
 *     7.0 km = ₹70
 *     8.0 km = ₹85
 *     10.0 km = ₹115
 * - Eco-friendly Packaging & Handling: ₹10 per order
 */

export interface PricingBreakdown {
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  totalAmount: number;
  distanceKm: number;
  isFreeDelivery: boolean;
  rateFormula: string;
}

export const pricingService = {
  BASE_DISTANCE_KM: 5,
  BASE_DELIVERY_FEE: 40,
  PER_KM_SURCHARGE: 15,
  PACKAGING_FEE: 10,

  /**
   * Calculates the exact delivery fee based on distance
   */
  calculateDeliveryFee(distanceKm: number, isPromoFree = false): number {
    if (isPromoFree) return 0;
    const dist = Math.max(0, Number(distanceKm) || 0);

    if (dist <= this.BASE_DISTANCE_KM) {
      return this.BASE_DELIVERY_FEE;
    }

    const additionalKm = Math.ceil(dist - this.BASE_DISTANCE_KM);
    return this.BASE_DELIVERY_FEE + additionalKm * this.PER_KM_SURCHARGE;
  },

  /**
   * Generates a complete verified pricing breakdown for checkout or order validation
   */
  computeOrderPricing(
    itemsSubtotal: number,
    distanceKm: number = 3.5,
    isFreeDeliveryPromo = false,
    customPackagingFee = 10
  ): PricingBreakdown {
    const subtotal = Math.max(0, Math.round(Number(itemsSubtotal) * 100) / 100);
    const deliveryFee = this.calculateDeliveryFee(distanceKm, isFreeDeliveryPromo);
    const packagingFee = customPackagingFee !== undefined ? Number(customPackagingFee) : this.PACKAGING_FEE;
    const totalAmount = Math.round((subtotal + deliveryFee + packagingFee) * 100) / 100;

    let rateFormula = `≤ 5 km: ₹${this.BASE_DELIVERY_FEE}`;
    if (distanceKm > this.BASE_DISTANCE_KM) {
      const extraKm = Math.ceil(distanceKm - this.BASE_DISTANCE_KM);
      rateFormula = `₹${this.BASE_DELIVERY_FEE} + (${extraKm} km × ₹${this.PER_KM_SURCHARGE}) = ₹${deliveryFee}`;
    }

    return {
      subtotal,
      deliveryFee,
      packagingFee,
      totalAmount,
      distanceKm,
      isFreeDelivery: isFreeDeliveryPromo,
      rateFormula,
    };
  },

  /**
   * Validates that an order payload has mathematically consistent totals
   */
  validateOrderIntegrity(order: {
    items: { price: number; quantity: number }[];
    deliveryFee: number;
    packagingFee?: number;
    totalAmount: number;
  }): { isValid: boolean; expectedTotal: number; calculatedSubtotal: number } {
    const calculatedSubtotal = order.items.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    const packFee = order.packagingFee !== undefined ? Number(order.packagingFee) : this.PACKAGING_FEE;
    const expectedTotal = Math.round((calculatedSubtotal + Number(order.deliveryFee) + packFee) * 100) / 100;
    const isValid = Math.abs(expectedTotal - Number(order.totalAmount)) < 0.05;

    return {
      isValid,
      expectedTotal,
      calculatedSubtotal,
    };
  },
};
