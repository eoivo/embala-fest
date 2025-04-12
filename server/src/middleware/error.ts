import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: (req as any).user?._id,
  });

  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' ? 
      statusCode === 500 ? 'Internal server error' : err.message :
      err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}