import { Request, Response } from 'express';
import { startSession } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { publicUser, UserModel } from '../models/User';
import { hashPassword } from '../utils/password';
import type { CreateUserInput, UpdateUserInput } from '../validators/user';

export async function listUsers(_req: Request, res: Response) {
  const users = await UserModel.find().sort({ role: 1, name: 1 }).lean();
  res.json(users.map(publicUser));
}

export async function createUser(req: Request, res: Response) {
  const input = req.body as CreateUserInput;

  if (await UserModel.exists({ username: input.username })) {
    throw new HttpError(409, `Username "${input.username}" is already taken`);
  }

  const user = await UserModel.create({
    name: input.name,
    username: input.username,
    role: input.role,
    language: input.language,
    passwordHash: await hashPassword(input.password),
  });
  res.status(201).json(publicUser(user));
}

export async function updateUser(req: Request, res: Response) {
  const input = req.body as UpdateUserInput;
  const isSelf = req.params.id === req.user!.id;

  // An admin can't lock themselves out.
  if (isSelf && input.role && input.role !== 'admin') {
    throw new HttpError(400, 'You cannot remove your own admin access');
  }
  if (isSelf && input.active === false) {
    throw new HttpError(400, 'You cannot disable your own account');
  }

  const user = await UserModel.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');

  let signOutEverywhere = false;

  if (input.name !== undefined) user.name = input.name;
  if (input.language !== undefined) user.language = input.language;
  if (input.role !== undefined && input.role !== user.role) {
    user.role = input.role;
    signOutEverywhere = true;
  }
  if (input.active !== undefined && input.active !== user.active) {
    user.active = input.active;
    if (!input.active) signOutEverywhere = true;
  }
  if (input.password) {
    user.passwordHash = await hashPassword(input.password);
    signOutEverywhere = true;
  }

  if (signOutEverywhere) user.tokenVersion += 1;
  await user.save();

  // Keep the admin signed in on this device after changing their own password.
  if (isSelf && signOutEverywhere) startSession(res, user);

  res.json(publicUser(user));
}
