import { Router } from 'express';
import { createUser, listUsers, updateUser } from '../controllers/user.controller';
import { asyncHandler } from '../middleware/error';
import { validateBody, validateIdParam } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../validators/user';

const router = Router();

router.get('/', asyncHandler(listUsers));
router.post('/', validateBody(createUserSchema), asyncHandler(createUser));
router.patch('/:id', validateIdParam(), validateBody(updateUserSchema), asyncHandler(updateUser));

export default router;
