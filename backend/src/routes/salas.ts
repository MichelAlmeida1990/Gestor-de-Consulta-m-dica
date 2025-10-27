import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { CustomError } from '../middleware/errorHandler';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Schemas de validação
const salaSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  numero: Joi.string().max(20).optional(),
  andar: Joi.number().integer().min(0).max(50).optional(),
  equipamentos: Joi.array().items(Joi.string()).default([]),
  capacidade: Joi.number().integer().min(1).max(10).default(1)
});

// GET /api/salas - Listar salas
router.get('/', async (req, res, next) => {
  try {
    const { ativa, andar, capacidade_min } = req.query;

    const where: any = {};
    
    if (ativa !== undefined) {
      where.ativa = ativa === 'true';
    }
    
    if (andar) {
      where.andar = parseInt(andar as string);
    }
    
    if (capacidade_min) {
      where.capacidade = { gte: parseInt(capacidade_min as string) };
    }

    const salas = await prisma.salas.findMany({
      where,
      include: {
        _count: {
          select: {
            horarios_disponiveis: {
              where: {
                data: { gte: new Date() },
                disponivel: true
              }
            }
          }
        }
      },
      orderBy: [
        { andar: 'asc' },
        { nome: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: salas
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/salas/:id - Buscar sala por ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const sala = await prisma.salas.findUnique({
      where: { id: parseInt(id) },
      include: {
        horarios_disponiveis: {
          where: {
            data: { gte: new Date() },
            disponivel: true
          },
          include: {
            medico: {
              include: {
                usuario: {
                  select: {
                    nome: true,
                    especialidade: true
                  }
                }
              }
            }
          },
          orderBy: [
            { data: 'asc' },
            { hora_inicio: 'asc' }
          ]
        }
      }
    });

    if (!sala) {
      throw new CustomError('Sala não encontrada', 404);
    }

    res.json({
      success: true,
      data: sala
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/salas - Criar sala (apenas admin)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = salaSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const sala = await prisma.salas.create({
      data: value
    });

    res.status(201).json({
      success: true,
      data: sala,
      message: 'Sala criada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/salas/:id - Atualizar sala (apenas admin)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = salaSchema.validate(req.body);

    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const sala = await prisma.salas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sala) {
      throw new CustomError('Sala não encontrada', 404);
    }

    const salaAtualizada = await prisma.salas.update({
      where: { id: parseInt(id) },
      data: value
    });

    res.json({
      success: true,
      data: salaAtualizada,
      message: 'Sala atualizada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/salas/:id/status - Ativar/Desativar sala (apenas admin)
router.put('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ativa } = req.body;

    if (typeof ativa !== 'boolean') {
      throw new CustomError('Status deve ser true ou false', 400);
    }

    const sala = await prisma.salas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sala) {
      throw new CustomError('Sala não encontrada', 404);
    }

    const salaAtualizada = await prisma.salas.update({
      where: { id: parseInt(id) },
      data: { ativa }
    });

    res.json({
      success: true,
      data: salaAtualizada,
      message: `Sala ${ativa ? 'ativada' : 'desativada'} com sucesso`
    });

  } catch (error) {
    next(error);
  }
});

// DELETE /api/salas/:id - Deletar sala (apenas admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const sala = await prisma.salas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sala) {
      throw new CustomError('Sala não encontrada', 404);
    }

    // Verificar se tem horários agendados
    const horariosAgendados = await prisma.horarios_disponiveis.count({
      where: {
        sala_id: parseInt(id),
        data: { gte: new Date() },
        disponivel: false
      }
    });

    if (horariosAgendados > 0) {
      throw new CustomError('Não é possível deletar sala com horários agendados', 400);
    }

    await prisma.salas.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Sala deletada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/salas/disponibilidade - Verificar disponibilidade de salas
router.get('/disponibilidade/verificar', async (req, res, next) => {
  try {
    const { data, hora_inicio, hora_fim } = req.query;

    if (!data || !hora_inicio || !hora_fim) {
      throw new CustomError('Data, hora_inicio e hora_fim são obrigatórios', 400);
    }

    const salasDisponiveis = await prisma.salas.findMany({
      where: {
        ativa: true,
        horarios_disponiveis: {
          none: {
            data: new Date(data as string),
            OR: [
              {
                AND: [
                  { hora_inicio: { lte: hora_inicio as string } },
                  { hora_fim: { gt: hora_inicio as string } }
                ]
              },
              {
                AND: [
                  { hora_inicio: { lt: hora_fim as string } },
                  { hora_fim: { gte: hora_fim as string } }
                ]
              }
            ],
            disponivel: false
          }
        }
      },
      include: {
        equipamentos: true
      }
    });

    res.json({
      success: true,
      data: {
        data: data,
        hora_inicio: hora_inicio,
        hora_fim: hora_fim,
        salas_disponiveis: salasDisponiveis
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;
