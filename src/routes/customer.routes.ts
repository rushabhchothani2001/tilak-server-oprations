import { Router } from 'express';
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from '../controllers/customer.controller';
import { asyncHandler } from '../middleware/error';
import { validateBody, validateIdParam } from '../middleware/validate';
import { customerSchema } from '../validators/customer';

const router = Router();

router.get('/', asyncHandler(listCustomers));
router.post('/', validateBody(customerSchema), asyncHandler(createCustomer));
router.get('/:id', validateIdParam(), asyncHandler(getCustomer));
router.put('/:id', validateIdParam(), validateBody(customerSchema), asyncHandler(updateCustomer));
router.delete('/:id', validateIdParam(), asyncHandler(deleteCustomer));

export default router;
