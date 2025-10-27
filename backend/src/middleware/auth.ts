import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from './errorHandler';
import { Usuario } from '../types';

// Estender interface Request para incluir usuário
declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}

// Middleware de autenticação
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Token de acesso não fornecido', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    if (!token) {
      throw new CustomError('Token de acesso não fornecido', 401);
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Aqui você pode buscar o usuário no banco de dados se necessário
    // Por enquanto, vamos usar os dados do token
    req.usuario = {
      id: decoded.id,
      uuid: decoded.uuid,
      nome: decoded.nome,
      email: decoded.email,
      tipo: decoded.tipo,
      telefone: decoded.telefone,
      cpf: decoded.cpf,
      data_nascimento: decoded.data_nascimento,
      endereco: decoded.endereco,
      ativo: decoded.ativo,
      created_at: decoded.created_at,
      updated_at: decoded.updated_at
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('Token inválido', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new CustomError('Token expirado', 401));
    } else {
      next(error);
    }
  }
};

// Middleware para verificar tipo de usuário
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return next(new CustomError('Usuário não autenticado', 401));
    }

    if (!roles.includes(req.usuario.tipo)) {
      return next(new CustomError('Acesso negado. Permissão insuficiente.', 403));
    }

    next();
  };
};

// Middleware específico para médicos
export const requireMedico = requireRole(['medico', 'admin']);

// Middleware específico para administradores
export const requireAdmin = requireRole(['admin']);

// Middleware para verificar se o usuário está ativo
export const requireActiveUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.usuario) {
    return next(new CustomError('Usuário não autenticado', 401));
  }

  if (!req.usuario.ativo) {
    return next(new CustomError('Usuário inativo', 403));
  }

  next();
};

// Middleware para verificar se o usuário pode acessar recursos de outro usuário
export const requireOwnershipOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.usuario) {
    return next(new CustomError('Usuário não autenticado', 401));
  }

  const resourceUserId = parseInt(req.params.id || req.params.usuarioId);
  
  // Admin pode acessar qualquer recurso
  if (req.usuario.tipo === 'admin') {
    return next();
  }

  // Usuário só pode acessar seus próprios recursos
  if (req.usuario.id !== resourceUserId) {
    return next(new CustomError('Acesso negado. Você só pode acessar seus próprios recursos.', 403));
  }

  next();
};

// Middleware para verificar se médico pode acessar consultas
export const requireMedicoOrOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.usuario) {
    return next(new CustomError('Usuário não autenticado', 401));
  }

  // Admin pode acessar qualquer consulta
  if (req.usuario.tipo === 'admin') {
    return next();
  }

  // Médico pode acessar suas próprias consultas
  if (req.usuario.tipo === 'medico') {
    return next();
  }

  // Paciente só pode acessar suas próprias consultas
  const consultaId = parseInt(req.params.id);
  // Aqui você precisaria verificar se a consulta pertence ao paciente
  // Por enquanto, vamos permitir o acesso
  next();
};

// Função para gerar token JWT
export const generateToken = (usuario: Usuario): string => {
  const payload = {
    id: usuario.id,
    uuid: usuario.uuid,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
    telefone: usuario.telefone,
    cpf: usuario.cpf,
    data_nascimento: usuario.data_nascimento,
    endereco: usuario.endereco,
    ativo: usuario.ativo,
    created_at: usuario.created_at,
    updated_at: usuario.updated_at
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Função para verificar token sem middleware
export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};
