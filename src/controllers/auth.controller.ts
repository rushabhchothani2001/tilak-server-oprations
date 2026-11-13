import { Request, Response } from 'express';
import { endSession, startSession } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { publicUser, UserModel } from '../models/User';
import { getDummyHash, verifyPassword } from '../utils/password';
import type { LoginInput, PreferencesInput } from '../validators/user';

const INVALID_LOGIN = 'Incorrect username or password';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginInput;

  const user = await UserModel.findOne({ username }).select('+passwordHash');
  // Always run a hash comparison so response time doesn't reveal whether the username exists.
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !passwordOk) throw new HttpError(401, INVALID_LOGIN);
  if (!user.active) throw new HttpError(403, 'This account has been disabled. Contact the admin.');

  user.lastLoginAt = new Date();
  await user.save();

  startSession(res, user);
  res.json(publicUser(user));
}

export async function logout(_req: Request, res: Response) {
  endSession(res);
  res.status(204).end();
}

/** Lets any signed-in person (admin or worker) save their own app language. */
export async function updatePreferences(req: Request, res: Response) {
  const { language } = req.body as PreferencesInput;
  const user = await UserModel.findByIdAndUpdate(req.user!.id, { language }, { new: true, runValidators: true }).lean();
  if (!user) throw new HttpError(401, 'Please log in to continue.');
  res.json(publicUser(user));
}

export async function me(req: Request, res: Response) {
  const user = await UserModel.findById(req.user!.id).lean();
  if (!user) throw new HttpError(401, 'Please log in to continue.');
  res.json(publicUser(user));
}
