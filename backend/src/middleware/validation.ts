import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  dateOfBirth: z.string().refine((dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    
    // Check if user is at least 18 years old
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    
    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      actualAge--;
    }
    
    return actualAge >= 18;
  }, {
    message: 'You must be at least 18 years old to register'
  })
});

export const addChannelSchema = z.object({
  channelInput: z.string().min(1)
});

export const videoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  channelId: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'popular']).default('newest')
});

export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.method === 'GET' ? req.query : req.body);
      if (req.method === 'GET') {
        req.query = validated as any;
      } else {
        req.body = validated;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        });
      }
      next(error);
    }
  };
}

