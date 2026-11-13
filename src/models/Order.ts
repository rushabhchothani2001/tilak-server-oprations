import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';
import { BOX_PLY, ORDER_STATUSES, PAPER_TYPES, PRINT_TYPES, SIZE_UNITS } from '../constants/order';

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    producedQuantity: { type: Number, default: null },
    // Name of the user who made the change.
    changedBy: { type: String, default: '' },
    changedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

// Amounts are in rupees and always computed on the server (see utils/pricing.ts).
const pricingSchema = new Schema(
  {
    ratePerBox: { type: Number, required: true, min: 0 },
    gstApplicable: { type: Boolean, required: true },
    gstRate: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    // What the boxes are for, e.g. "Mango juice 1L carton". Empty on orders placed before this field existed.
    productName: { type: String, trim: true, default: '' },

    size: {
      length: { type: Number, required: true, min: 0 },
      width: { type: Number, required: true, min: 0 },
      height: { type: Number, required: true, min: 0 },
      unit: { type: String, enum: SIZE_UNITS, default: 'inch' },
    },

    ply: { type: String, enum: BOX_PLY, required: true },
    paperType: { type: String, enum: PAPER_TYPES, required: true },
    // Set only when paperType is "printed".
    printType: { type: String, enum: PRINT_TYPES },

    insidePaper: {
      top: { type: Number, required: true, min: 0 },
      // One value per flute layer, e.g. [120, 150] for "120/150".
      fluted: {
        type: [{ type: Number, min: 0 }],
        validate: {
          validator: (values: number[]) => values.length > 0,
          message: 'Enter fluted value',
        },
      },
    },

    laminated: { type: Boolean, required: true },
    quantity: { type: Number, required: true, min: 1 },
    // Admin-only commercial details. Missing on orders placed before pricing existed.
    pricing: { type: pricingSchema, default: undefined },
    expectedDeliveryDate: { type: Date, required: true },

    status: { type: String, enum: ORDER_STATUSES, default: 'order_placed', index: true },
    // Recorded by the worker when the order is marked "ready to shipment".
    producedQuantity: { type: Number, default: null, min: 0 },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
);

export type Order = InferSchemaType<typeof orderSchema>;
export type OrderDocument = HydratedDocument<Order>;

export const OrderModel = model('Order', orderSchema);
