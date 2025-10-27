import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { CustomError, handleDatabaseError } from '../middleware/errorHandler';
import { authenticate, requireOwnershipOrAdmin, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Schemas de validação
const updateUsuarioSchema = Joi.object({
  nome: Joi.string().min(2).max(255).optional(),
  telefone: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).optional(),
  data_nascimento: Joi.date().max('now').optional(),
  endereco: Joi.object().optional()
});

const updateSenhaSchema = Joi.object({
  senha_atual: Joi.string().required(),
  nova_senha: Joi.string().min(6).required()
});

// GET /api/usuarios - Listar usuários (apenas admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tipo, ativo, search } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    
    if (tipo) where.tipo = tipo;
    if (ativo !== undefined) where.ativo = ativo === 'true';
    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [usuarios, total] = await Promise.all([
      prisma.usuarios.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          uuid: true,
          nome: true,
          email: true,
          tipo: true,
          telefone: true,
          cpf: true,
          data_nascimento: true,
          ativo: true,
          created_at: true,
          updated_at: true,
          medicos: {
            select: {
              id: true,
              crm: true,
              especialidade: true,
              ativo: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.usuarios.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        usuarios,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', authenticate, requireOwnershipOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const usuario = await prisma.usuarios.findUnique({
      where: { id: parseInt(id) },
      include: {
        medicos: true,
        consultas: {
          include: {
            medico: {
              include: {
                usuario: true
              }
            },
            sala: true
          },
          orderBy: { data: 'desc' },
          take: 10
        }
      }
    });

    if (!usuario) {
      throw new CustomError('Usuário não encontrado', 404);
    }

    res.json({
      success: true,
      data: usuario
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/usuarios/:id - Atualizar usuário
router.put('/:id', authenticate, requireOwnershipOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUsuarioSchema.validate(req.body);
    
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id: parseInt(id) }
    });

    if (!usuario) {
      throw new CustomError('Usuário não encontrado', 404);
    }

    const usuarioAtualizado = await prisma.usuarios.update({
      where: { id: parseInt(id) },
      data: value
    });

    res.json({
      success: true,
      data: usuarioAtualizado,
      message: 'Usuário atualizado com sucesso'
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      next(handleDatabaseError(error));
    } else {
      next(error);
    }
  }
});

// PUT /api/usuarios/:id/senha - Alterar senha
router.put('/:id/senha', authenticate, requireOwnershipOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateSenhaSchema.validate(req.body);
    
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const { senha_atual, nova_senha } = value;

    const usuario = await prisma.usuarios.findUnique({
      where: { id: parseInt(id) }
    });

    if (!usuario) {
      throw new CustomError('Usuário não encontrado', 404);
    }

    // Verificar senha atual
    const bcrypt = require('bcryptjs');
    const senhaValida = await bcrypt.compare(senha_atual, usuario.senha);
    
    if (!senhaValida) {
      throw new CustomError('Senha atual incorreta', 400);
    }

    // Criptografar nova senha
    const novaSenhaHash = await bcrypt.hash(nova_senha, 12);

    await prisma.usuarios.update({
      where: { id: parseInt(id) },
      data: { senha: novaSenhaHash }
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/usuarios/:id/status - Ativar/Desativar usuário (apenas admin)
router.put('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    if (typeof ativo !== 'boolean') {
      throw new CustomError('Status deve ser true ou false', 400);
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id: parseInt(id) }
    });

    if (!usuario) {
      throw new CustomError('Usuário não encontrado', 404);
    }

    const usuarioAtualizado = await prisma.usuarios.update({
      where: { id: parseInt(id) },
      data: { ativo }
    });

    res.json({
      success: true,
      data: usuarioAtualizado,
      message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`
    });

  } catch (error) {
    next(error);
  }
});

// DELETE /api/usuarios/:id - Deletar usuário (apenas admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuarios.findUnique({
      where: { id: parseInt(id) }
    });

    if (!usuario) {
      throw new CustomError('Usuário não encontrado', 404);
    }

    // Verificar se tem consultas agendadas
    const consultasAgendadas = await prisma.consultas.count({
      where: {
        paciente_id: parseInt(id),
        status: { in: ['agendada', 'confirmada'] }
      }
    });

    if (consultasAgendadas > 0) {
      throw new CustomError('Não é possível deletar usuário com consultas agendadas', 400);
    }

    await prisma.usuarios.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/usuarios/:id/consultas - Listar consultas do usuário
router.get('/:id/consultas', authenticate, requireOwnershipOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status, data_inicio, data_fim } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      paciente_id: parseInt(id)
    };

    if (status) where.status = status;
    if (data_inicio) where.data = { gte: new Date(data_inicio as string) };
    if (data_fim) where.data = { lte: new Date(data_fim as string) };

    const [consultas, total] = await Promise.all([
      prisma.consultas.findMany({
        where,
        skip,
        take,
        include: {
          medico: {
            include: {
              usuario: true
            }
          },
          sala: true
        },
        orderBy: { data: 'desc' }
      }),
      prisma.consultas.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        consultas,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;
