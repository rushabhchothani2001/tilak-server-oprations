import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, trim: true },
    helplinePhone: { type: String, trim: true, default: '' },
    gstNumber: { type: String, trim: true, uppercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

customerSchema.index({ name: 1 });

export type Customer = InferSchemaType<typeof customerSchema>;
export type CustomerDocument = HydratedDocument<Customer>;

export const CustomerModel = model('Customer', customerSchema);
