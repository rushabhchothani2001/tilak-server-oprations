import { Schema, model, InferSchemaType, Types } from 'mongoose';
import { USER_ROLES } from '../constants/auth';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true },
    active: { type: Boolean, default: true },
    // Incremented to sign the user out everywhere (password reset, deactivation, role change).
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const UserModel = model('User', userSchema);

/** The only user fields ever sent to the client. */
export function publicUser(user: Pick<User, '_id' | 'name' | 'username' | 'role' | 'active' | 'lastLoginAt' | 'createdAt'>) {
  return {
    _id: String(user._id),
    name: user.name,
    username: user.username,
    role: user.role,
    active: user.active,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
