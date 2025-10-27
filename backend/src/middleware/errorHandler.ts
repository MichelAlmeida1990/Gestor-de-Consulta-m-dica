import { Request, Response, NextFunction } from 'express';

// Interface para erros customizados
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Classe para erros customizados
export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware para tratamento de erros
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  console.error('❌ Erro:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Erro de validação do Prisma
  if (err.name === 'PrismaClientValidationError') {
    const message = 'Dados inválidos fornecidos';
    error = new CustomError(message, 400);
  }

  // Erro de conexão com banco
  if (err.name === 'PrismaClientKnownRequestError') {
    const message = 'Erro no banco de dados';
    error = new CustomError(message, 500);
  }

  // Erro de conexão
  if (err.name === 'PrismaClientConnectionError') {
    const message = 'Erro de conexão com o banco de dados';
    error = new CustomError(message, 500);
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = new CustomError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = new CustomError(message, 401);
  }

  // Erro de validação do Joi
  if (err.name === 'ValidationError') {
    const message = 'Dados de entrada inválidos';
    error = new CustomError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Erro interno do servidor',
      statusCode: error.statusCode || 500,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
};

// Middleware para rotas não encontradas
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`Rota não encontrada: ${req.originalUrl}`, 404);
  next(error);
};

// Função para criar erros customizados
export const createError = (message: string, statusCode: number = 500): CustomError => {
  return new CustomError(message, statusCode);
};

// Função para tratar erros de validação
export const handleValidationError = (errors: any[]): CustomError => {
  const message = errors.map(err => err.message).join(', ');
  return new CustomError(message, 400);
};

// Função para tratar erros de banco de dados
export const handleDatabaseError = (error: any): CustomError => {
  console.error('Database Error:', error);
  
  if (error.code === '23505') { // Unique violation
    return new CustomError('Registro já existe', 409);
  }
  
  if (error.code === '23503') { // Foreign key violation
    return new CustomError('Referência inválida', 400);
  }
  
  if (error.code === '23502') { // Not null violation
    return new CustomError('Campo obrigatório não informado', 400);
  }
  
  return new CustomError('Erro no banco de dados', 500);
};
