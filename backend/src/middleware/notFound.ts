import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';

// Middleware para rotas não encontradas
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`Rota não encontrada: ${req.originalUrl}`, 404);
  next(error);
};
