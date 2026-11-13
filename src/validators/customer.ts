import { z } from 'zod';

const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,14}$/;
// Indian GSTIN: 2-digit state code + PAN (10) + entity no. + "Z" + checksum
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');

export const customerSchema = z.object({
  name: z.string({ required_error: 'Customer name is required' }).trim().min(1, 'Customer name is required').max(100),
  companyName: optionalText(150),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(1, 'Phone number is required')
    .regex(PHONE_REGEX, 'Enter a valid phone number'),
  helplinePhone: optionalText(20).refine((v) => v === '' || PHONE_REGEX.test(v), 'Enter a valid phone number'),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .default('')
    .refine((v) => v === '' || GST_REGEX.test(v), 'Enter a valid 15-character GSTIN'),
  address: optionalText(500),
});

export type CustomerInput = z.infer<typeof customerSchema>;
