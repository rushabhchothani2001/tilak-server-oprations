import { Router } from 'express';
import { createOrder, deleteOrder, getOrder, listOrders } from '../controllers/order.controller';
import { asyncHandler } from '../middleware/error';
import { validateBody, validateIdParam } from '../middleware/validate';
import { createOrderSchema } from '../validators/order';

const router = Router();

router.get('/', asyncHandler(listOrders));
router.post('/', validateBody(createOrderSchema), asyncHandler(createOrder));
router.get('/:id', validateIdParam(), asyncHandler(getOrder));
router.delete('/:id', validateIdParam(), asyncHandler(deleteOrder));

export default router;
