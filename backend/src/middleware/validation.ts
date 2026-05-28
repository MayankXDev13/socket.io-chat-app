import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ ...req.body, ...req.query, ...req.params });
    if (!result.success) {
      return res.status(400).json({ errors: result.error.format() });
    }
    // attach parsed data to request for typed access
    (req as any).validated = result.data;
    next();
  };
};
