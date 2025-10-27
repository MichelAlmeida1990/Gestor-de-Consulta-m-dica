import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { CustomError } from '../middleware/errorHandler';
import { authenticate, requireOwnershipOrAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Schemas de validação
const notificacaoSchema = Joi.object({
  tipo: Joi.string().required(),
  titulo: Joi.string().min(2).max(255).required(),
  mensagem: Joi.string().min(2).required()
});

// GET /api/notificacoes - Listar notificações do usuário
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tipo, lida } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      usuario_id: req.usuario!.id
    };

    if (tipo) where.tipo = tipo;
    if (lida !== undefined) where.lida = lida === 'true';

    const [notificacoes, total] = await Promise.all([
      prisma.notificacoes.findMany({
        where,
        skip,
        take,
        orderBy: { data_envio: 'desc' }
      }),
      prisma.notificacoes.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        notificacoes,
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

// GET /api/notificacoes/nao-lidas - Contar notificações não lidas
router.get('/nao-lidas', authenticate, async (req, res, next) => {
  try {
    const count = await prisma.notificacoes.count({
      where: {
        usuario_id: req.usuario!.id,
        lida: false
      }
    });

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/notificacoes/:id/marcar-lida - Marcar notificação como lida
router.put('/:id/marcar-lida', authenticate, requireOwnershipOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notificacao = await prisma.notificacoes.findFirst({
      where: {
        id: parseInt(id),
        usuario_id: req.usuario!.id
      }
    });

    if (!notificacao) {
      throw new CustomError('Notificação não encontrada', 404);
    }

    const notificacaoAtualizada = await prisma.notificacoes.update({
      where: { id: parseInt(id) },
      data: {
        lida: true,
        data_leitura: new Date()
      }
    });

    res.json({
      success: true,
      data: notificacaoAtualizada,
      message: 'Notificação marcada como lida'
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/notificacoes/marcar-todas-lidas - Marcar todas as notificações como lidas
router.put('/marcar-todas-lidas', authenticate, async (req, res, next) => {
  try {
    await prisma.notificacoes.updateMany({
      where: {
        usuario_id: req.usuario!.id,
        lida: false
      },
      data: {
        lida: true,
        data_leitura: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas'
    });

  } catch (error) {
    next(error);
  }
});

// DELETE /api/notificacoes/:id - Deletar notificação
router.delete('/:id', authenticate, requireOwnershipOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notificacao = await prisma.notificacoes.findFirst({
      where: {
        id: parseInt(id),
        usuario_id: req.usuario!.id
      }
    });

    if (!notificacao) {
      throw new CustomError('Notificação não encontrada', 404);
    }

    await prisma.notificacoes.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Notificação deletada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// DELETE /api/notificacoes/limpar-lidas - Deletar notificações lidas
router.delete('/limpar-lidas', authenticate, async (req, res, next) => {
  try {
    const result = await prisma.notificacoes.deleteMany({
      where: {
        usuario_id: req.usuario!.id,
        lida: true
      }
    });

    res.json({
      success: true,
      data: { deletedCount: result.count },
      message: `${result.count} notificações lidas foram removidas`
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/notificacoes/enviar - Enviar notificação (apenas admin)
router.post('/enviar', authenticate, async (req, res, next) => {
  try {
    // Verificar se é admin
    if (req.usuario!.tipo !== 'admin') {
      throw new CustomError('Acesso negado', 403);
    }

    const { error, value } = notificacaoSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const { usuario_id, tipo, titulo, mensagem } = req.body;

    if (!usuario_id) {
      throw new CustomError('ID do usuário é obrigatório', 400);
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuario_id }
    });

    if (!usuario) {
      throw new CustomError('Usuário não encontrado', 404);
    }

    const notificacao = await prisma.notificacoes.create({
      data: {
        usuario_id,
        tipo,
        titulo,
        mensagem
      }
    });

    res.status(201).json({
      success: true,
      data: notificacao,
      message: 'Notificação enviada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/notificacoes/enviar-massa - Enviar notificação para múltiplos usuários (apenas admin)
router.post('/enviar-massa', authenticate, async (req, res, next) => {
  try {
    // Verificar se é admin
    if (req.usuario!.tipo !== 'admin') {
      throw new CustomError('Acesso negado', 403);
    }

    const { error, value } = notificacaoSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const { usuario_ids, tipo, titulo, mensagem } = req.body;

    if (!usuario_ids || !Array.isArray(usuario_ids) || usuario_ids.length === 0) {
      throw new CustomError('Lista de IDs de usuários é obrigatória', 400);
    }

    // Verificar se os usuários existem
    const usuarios = await prisma.usuarios.findMany({
      where: { id: { in: usuario_ids } },
      select: { id: true }
    });

    if (usuarios.length !== usuario_ids.length) {
      throw new CustomError('Alguns usuários não foram encontrados', 404);
    }

    // Criar notificações em lote
    const notificacoes = await Promise.all(
      usuario_ids.map(usuario_id =>
        prisma.notificacoes.create({
          data: {
            usuario_id,
            tipo,
            titulo,
            mensagem
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      data: { notificacoes },
      message: `${notificacoes.length} notificações enviadas com sucesso`
    });

  } catch (error) {
    next(error);
  }
});

export default router;
