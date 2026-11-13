import { RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';
import { HttpError } from './error';

/** Parses req.body with a zod schema and replaces it with the parsed (cleaned) value. */
export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };

const OBJECT_ID = /^[a-f\d]{24}$/i;

export const validateIdParam =
  (param = 'id'): RequestHandler =>
  (req, _res, next) => {
    if (!OBJECT_ID.test(req.params[param] ?? '')) {
      return next(new HttpError(400, 'Invalid id'));
    }
    next();
  };

export const isObjectId = (value: string): boolean => OBJECT_ID.test(value);
