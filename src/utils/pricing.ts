import { GST_RATE_PERCENT } from '../constants/order';

export interface OrderPricing {
  /** Rupees per box, at most 2 decimals. */
  ratePerBox: number;
  gstApplicable: boolean;
  /** The GST percentage used for this order (kept so old orders stay correct if the rate changes). */
  gstRate: number;
  /** quantity × ratePerBox, in rupees. */
  subtotal: number;
  /** GST on the subtotal, in rupees (0 when not applicable). */
  gstAmount: number;
  /** subtotal + gstAmount, in rupees. */
  total: number;
}

/**
 * Works in whole paise so the amounts never pick up floating-point noise:
 * 2,500 × ₹5.10 = ₹12,750.00, GST 5% = ₹637.50, total ₹13,387.50.
 */
export function computePricing(quantity: number, ratePerBox: number, gstApplicable: boolean): OrderPricing {
  const ratePaise = Math.round(ratePerBox * 100);
  const subtotalPaise = quantity * ratePaise;
  const gstRate = gstApplicable ? GST_RATE_PERCENT : 0;
  const gstPaise = Math.round((subtotalPaise * gstRate) / 100);

  return {
    ratePerBox: ratePaise / 100,
    gstApplicable,
    gstRate,
    subtotal: subtotalPaise / 100,
    gstAmount: gstPaise / 100,
    total: (subtotalPaise + gstPaise) / 100,
  };
}
