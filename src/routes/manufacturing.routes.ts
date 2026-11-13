import { Router } from 'express';
import {
  getManufacturingOrder,
  listManufacturingOrders,
  updateOrderStatus,
} from '../controllers/manufacturing.controller';
import { asyncHandler } from '../middleware/error';
import { validateBody, validateIdParam } from '../middleware/validate';
import { updateStatusSchema } from '../validators/order';

const router = Router();

router.get('/orders', asyncHandler(listManufacturingOrders));
router.get('/orders/:id', validateIdParam(), asyncHandler(getManufacturingOrder));
router.patch(
  '/orders/:id/status',
  validateIdParam(),
  validateBody(updateStatusSchema),
  asyncHandler(updateOrderStatus),
);

export default router;
