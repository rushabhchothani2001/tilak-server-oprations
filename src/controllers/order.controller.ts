import { Request, Response } from 'express';
import { OrderModel } from '../models/Order';
import { CustomerModel } from '../models/Customer';
import { nextSequence } from '../models/Counter';
import { HttpError } from '../middleware/error';
import { isObjectId } from '../middleware/validate';
import { ORDER_STATUSES, OrderStatus } from '../constants/order';
import { computePricing } from '../utils/pricing';
import type { CreateOrderInput } from '../validators/order';

const CUSTOMER_SUMMARY_FIELDS = 'name companyName phone';

/** Admin order list (includes customer summary). */
export async function listOrders(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};

  const { status, customer } = req.query;
  if (typeof status === 'string' && (ORDER_STATUSES as readonly string[]).includes(status)) {
    filter.status = status as OrderStatus;
  }
  if (typeof customer === 'string' && isObjectId(customer)) {
    filter.customer = customer;
  }

  const orders = await OrderModel.find(filter)
    .populate('customer', CUSTOMER_SUMMARY_FIELDS)
    .sort({ createdAt: -1 })
    .lean();
  res.json(orders);
}

/** Admin order detail (includes full customer details). */
export async function getOrder(req: Request, res: Response) {
  const order = await OrderModel.findById(req.params.id).populate('customer').lean();
  if (!order) throw new HttpError(404, 'Order not found');
  res.json(order);
}

export async function createOrder(req: Request, res: Response) {
  const { ratePerBox, gstApplicable, ...input } = req.body as CreateOrderInput;

  const customerExists = await CustomerModel.exists({ _id: input.customer });
  if (!customerExists) {
    throw new HttpError(400, 'Selected customer does not exist');
  }

  const seq = await nextSequence('order');
  const order = await OrderModel.create({
    ...input,
    // Amounts are always computed here, never taken from the browser.
    pricing: computePricing(input.quantity, ratePerBox, gstApplicable),
    orderNumber: `TI-${String(seq).padStart(5, '0')}`,
    status: 'order_placed',
    statusHistory: [{ status: 'order_placed', changedBy: req.user?.name ?? '', changedAt: new Date() }],
  });

  const populated = await order.populate('customer', CUSTOMER_SUMMARY_FIELDS);
  res.status(201).json(populated);
}

export async function deleteOrder(req: Request, res: Response) {
  const order = await OrderModel.findByIdAndDelete(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  res.status(204).end();
}
