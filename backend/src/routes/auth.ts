import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { CustomError, handleDatabaseError } from '../middleware/errorHandler';
import { authenticate, generateToken } from '../middleware/auth';
import { Usuario, LoginRequest, RegisterRequest, AuthResponse } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Schemas de validação
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  }),
  senha: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  })
});

const registerSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 255 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  }),
  senha: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  }),
  tipo: Joi.string().valid('paciente', 'medico').required().messages({
    'any.only': 'Tipo deve ser paciente ou medico',
    'any.required': 'Tipo é obrigatório'
  }),
  telefone: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).optional().messages({
    'string.pattern.base': 'Telefone deve estar no formato (XX) XXXXX-XXXX'
  }),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional().messages({
    'string.pattern.base': 'CPF deve estar no formato XXX.XXX.XXX-XX'
  }),
  data_nascimento: Joi.date().max('now').optional().messages({
    'date.max': 'Data de nascimento não pode ser no futuro'
  }),
  endereco: Joi.object().optional()
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const { email, senha }: LoginRequest = value;

    // Buscar usuário no banco
    const usuario = await prisma.usuarios.findUnique({
      where: { email },
      include: {
        medicos: true
      }
    });

    if (!usuario) {
      throw new CustomError('Email ou senha incorretos', 401);
    }

    if (!usuario.ativo) {
      throw new CustomError('Usuário inativo', 403);
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new CustomError('Email ou senha incorretos', 401);
    }

    // Gerar token
    const token = generateToken(usuario as Usuario);

    const response: AuthResponse = {
      token,
      usuario: {
        id: usuario.id,
        uuid: usuario.uuid,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo as 'paciente' | 'medico' | 'admin',
        telefone: usuario.telefone,
        cpf: usuario.cpf,
        data_nascimento: usuario.data_nascimento,
        endereco: usuario.endereco,
        ativo: usuario.ativo,
        created_at: usuario.created_at,
        updated_at: usuario.updated_at
      }
    };

    // Se for médico, incluir dados do médico
    if (usuario.tipo === 'medico' && usuario.medicos.length > 0) {
      response.medico = usuario.medicos[0];
    }

    res.json({
      success: true,
      data: response,
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const dados: RegisterRequest = value;

    // Verificar se email já existe
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { email: dados.email }
    });

    if (usuarioExistente) {
      throw new CustomError('Email já cadastrado', 409);
    }

    // Verificar se CPF já existe (se fornecido)
    if (dados.cpf) {
      const cpfExistente = await prisma.usuarios.findUnique({
        where: { cpf: dados.cpf }
      });

      if (cpfExistente) {
        throw new CustomError('CPF já cadastrado', 409);
      }
    }

    // Criptografar senha
    const senhaHash = await bcrypt.hash(dados.senha, 12);

    // Criar usuário
    const novoUsuario = await prisma.usuarios.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: senhaHash,
        tipo: dados.tipo,
        telefone: dados.telefone,
        cpf: dados.cpf,
        data_nascimento: dados.data_nascimento ? new Date(dados.data_nascimento) : null,
        endereco: dados.endereco
      }
    });

    // Gerar token
    const token = generateToken(novoUsuario as Usuario);

    const response: AuthResponse = {
      token,
      usuario: {
        id: novoUsuario.id,
        uuid: novoUsuario.uuid,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        tipo: novoUsuario.tipo as 'paciente' | 'medico' | 'admin',
        telefone: novoUsuario.telefone,
        cpf: novoUsuario.cpf,
        data_nascimento: novoUsuario.data_nascimento,
        endereco: novoUsuario.endereco,
        ativo: novoUsuario.ativo,
        created_at: novoUsuario.created_at,
        updated_at: novoUsuario.updated_at
      }
    };

    res.status(201).json({
      success: true,
      data: response,
      message: 'Usuário cadastrado com sucesso'
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      next(handleDatabaseError(error));
    } else {
      next(error);
    }
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Em um sistema mais robusto, você poderia invalidar o token
    // Por enquanto, apenas retornamos sucesso
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id: req.usuario!.id },
      include: {
        medicos: true
      }
    });

    if (!usuario) {
      throw new CustomError('Usuário não encontrado', 404);
    }

    const response: AuthResponse = {
      token: '', // Não retornamos o token aqui
      usuario: {
        id: usuario.id,
        uuid: usuario.uuid,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo as 'paciente' | 'medico' | 'admin',
        telefone: usuario.telefone,
        cpf: usuario.cpf,
        data_nascimento: usuario.data_nascimento,
        endereco: usuario.endereco,
        ativo: usuario.ativo,
        created_at: usuario.created_at,
        updated_at: usuario.updated_at
      }
    };

    // Se for médico, incluir dados do médico
    if (usuario.tipo === 'medico' && usuario.medicos.length > 0) {
      response.medico = usuario.medicos[0];
    }

    res.json({
      success: true,
      data: response.usuario,
      medico: response.medico
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', authenticate, async (req, res, next) => {
  try {
    // Gerar novo token
    const token = generateToken(req.usuario!);

    res.json({
      success: true,
      data: { token },
      message: 'Token renovado com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

export default router;
