import { Schema, model, InferSchemaType, Types } from 'mongoose';
import { LANGUAGES, USER_ROLES } from '../constants/auth';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true },
    // Preferred app language. Unset until the person (or an admin) picks one.
    language: { type: String, enum: LANGUAGES },
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
export function publicUser(
  user: Pick<User, '_id' | 'name' | 'username' | 'role' | 'language' | 'active' | 'lastLoginAt' | 'createdAt'>,
) {
  return {
    _id: String(user._id),
    name: user.name,
    username: user.username,
    role: user.role,
    language: user.language ?? null,
    active: user.active,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
