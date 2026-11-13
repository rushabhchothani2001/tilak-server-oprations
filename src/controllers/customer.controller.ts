import { Request, Response } from 'express';
import { CustomerModel } from '../models/Customer';
import { OrderModel } from '../models/Order';
import { HttpError } from '../middleware/error';
import type { CustomerInput } from '../validators/customer';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listCustomers(req: Request, res: Response) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const filter = search
    ? {
        $or: ['name', 'companyName', 'phone', 'gstNumber'].map((field) => ({
          [field]: { $regex: escapeRegex(search), $options: 'i' },
        })),
      }
    : {};

  const customers = await CustomerModel.find(filter).sort({ name: 1 }).lean();
  res.json(customers);
}

export async function getCustomer(req: Request, res: Response) {
  const customer = await CustomerModel.findById(req.params.id).lean();
  if (!customer) throw new HttpError(404, 'Customer not found');
  res.json(customer);
}

export async function createCustomer(req: Request, res: Response) {
  const customer = await CustomerModel.create(req.body as CustomerInput);
  res.status(201).json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const customer = await CustomerModel.findByIdAndUpdate(req.params.id, req.body as CustomerInput, {
    new: true,
    runValidators: true,
  }).lean();
  if (!customer) throw new HttpError(404, 'Customer not found');
  res.json(customer);
}

export async function deleteCustomer(req: Request, res: Response) {
  const orderCount = await OrderModel.countDocuments({ customer: req.params.id });
  if (orderCount > 0) {
    throw new HttpError(
      409,
      `This customer has ${orderCount} order${orderCount === 1 ? '' : 's'} and cannot be deleted`,
    );
  }

  const customer = await CustomerModel.findByIdAndDelete(req.params.id);
  if (!customer) throw new HttpError(404, 'Customer not found');
  res.status(204).end();
}
