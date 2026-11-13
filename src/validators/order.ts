import { z } from 'zod';
import {
  BOX_PLY,
  FINAL_STATUS,
  PAPER_TYPES,
  PRINT_TYPES,
  SIZE_UNITS,
  WORKER_STATUSES,
} from '../constants/order';

const positiveNumber = (label: string) =>
  z.number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` }).positive(`${label} must be greater than 0`);

const nonNegativeNumber = (label: string) =>
  z.number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` }).nonnegative(`${label} cannot be negative`);

const FLUTED_FORMAT = 'Enter numbers separated by / (e.g. 120 or 120/150)';

/**
 * Accepts "120/150/160", a single number, or an array of numbers.
 * Returns null for anything malformed so the schema reports one clear message.
 */
function toFlutedList(value: unknown): unknown {
  if (value === undefined || value === '') return undefined;
  const parts =
    typeof value === 'number' ? [value] : typeof value === 'string' ? value.split('/') : Array.isArray(value) ? value : null;
  if (!parts) return null;

  const numbers = parts.map((p) => (typeof p === 'string' ? (p.trim() === '' ? NaN : Number(p.trim())) : p));
  return numbers.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0) ? numbers : null;
}

const flutedSchema = z.preprocess(
  toFlutedList,
  z
    .array(z.number(), { required_error: 'Enter fluted value', invalid_type_error: FLUTED_FORMAT })
    .min(1, 'Enter fluted value')
    .max(10, 'Enter at most 10 fluted values'),
);

export const createOrderSchema = z
  .object({
    customer: z.string({ required_error: 'Select a customer' }).regex(/^[a-f\d]{24}$/i, 'Select a customer'),
    productName: z
      .string({ required_error: 'Enter the product name', invalid_type_error: 'Enter the product name' })
      .trim()
      .min(1, 'Enter the product name')
      .max(120, 'Product name is too long (120 characters max)'),
    size: z.object({
      length: positiveNumber('Length'),
      width: positiveNumber('Width'),
      height: positiveNumber('Height'),
      unit: z.enum(SIZE_UNITS).default('inch'),
    }),
    ply: z.enum(BOX_PLY, { errorMap: () => ({ message: 'Select 3-ply or 5-ply' }) }),
    paperType: z.enum(PAPER_TYPES, { errorMap: () => ({ message: 'Select printed or plain' }) }),
    printType: z.enum(PRINT_TYPES, { errorMap: () => ({ message: 'Select 4-color or single color' }) }).nullish(),
    insidePaper: z.object({
      top: nonNegativeNumber('Top'),
      fluted: flutedSchema,
    }),
    laminated: z.boolean({ required_error: 'Select laminated yes or no', invalid_type_error: 'Select laminated yes or no' }),
    quantity: z
      .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
      .int('Quantity must be a whole number')
      .positive('Quantity must be at least 1'),
    expectedDeliveryDate: z.coerce.date({ errorMap: () => ({ message: 'Select the expected delivery date' }) }),
  })
  .superRefine((order, ctx) => {
    if (order.paperType === 'printed' && !order.printType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['printType'], message: 'Select 4-color or single color' });
    }
  })
  // Print type is meaningless for plain paper, so drop it.
  .transform((order) => ({
    ...order,
    printType: order.paperType === 'printed' ? order.printType ?? undefined : undefined,
  }));

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateStatusSchema = z
  .object({
    status: z.enum(WORKER_STATUSES, { errorMap: () => ({ message: 'Select a valid status' }) }),
    producedQuantity: z
      .number({ invalid_type_error: 'Produced quantity must be a number' })
      .int('Produced quantity must be a whole number')
      .nonnegative('Produced quantity cannot be negative')
      .nullish(),
  })
  .superRefine((body, ctx) => {
    if (body.status === FINAL_STATUS && (body.producedQuantity === undefined || body.producedQuantity === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['producedQuantity'],
        message: 'Enter the quantity produced',
      });
    }
  });

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
