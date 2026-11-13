import { Request, Response } from 'express';
import { OrderModel } from '../models/Order';
import { HttpError } from '../middleware/error';
import { FINAL_STATUS, ORDER_STATUSES } from '../constants/order';
import type { UpdateStatusInput } from '../validators/order';

/**
 * Workers only see order specifications — never customer details or prices.
 * Every query in this controller excludes those fields.
 */
const HIDE_CUSTOMER = '-customer -pricing';

export async function listManufacturingOrders(req: Request, res: Response) {
  const { status } = req.query;
  let filter: Record<string, unknown> = {};

  if (status === 'active') {
    filter = { status: { $ne: FINAL_STATUS } };
  } else if (typeof status === 'string' && (ORDER_STATUSES as readonly string[]).includes(status)) {
    filter = { status };
  }

  const orders = await OrderModel.find(filter)
    .select(HIDE_CUSTOMER)
    .sort({ expectedDeliveryDate: 1, createdAt: 1 })
    .lean();
  res.json(orders);
}

export async function getManufacturingOrder(req: Request, res: Response) {
  const order = await OrderModel.findById(req.params.id).select(HIDE_CUSTOMER).lean();
  if (!order) throw new HttpError(404, 'Order not found');
  res.json(order);
}

export async function updateOrderStatus(req: Request, res: Response) {
  const { status, producedQuantity } = req.body as UpdateStatusInput;

  const order = await OrderModel.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');

  // Produced quantity is only meaningful once the order is ready to ship.
  const nextProduced = status === FINAL_STATUS ? (producedQuantity ?? null) : null;

  const changed = order.status !== status || order.producedQuantity !== nextProduced;
  if (changed) {
    order.status = status;
    order.producedQuantity = nextProduced;
    order.statusHistory.push({
      status,
      producedQuantity: nextProduced,
      changedBy: req.user?.name ?? '',
      changedAt: new Date(),
    });
    await order.save();
  }

  const updated = await OrderModel.findById(order._id).select(HIDE_CUSTOMER).lean();
  res.json(updated);
}
