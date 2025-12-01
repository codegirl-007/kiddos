import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);
  
  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  });
}



