import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { CustomError } from '../middleware/errorHandler';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Schemas de validação
const configuracaoSchema = Joi.object({
  chave: Joi.string().min(2).max(100).required(),
  valor: Joi.string().required(),
  descricao: Joi.string().optional(),
  tipo: Joi.string().valid('string', 'number', 'boolean', 'array', 'object').default('string')
});

// GET /api/configuracoes - Listar configurações
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { tipo, search } = req.query;

    const where: any = {};
    
    if (tipo) where.tipo = tipo;
    if (search) {
      where.OR = [
        { chave: { contains: search as string, mode: 'insensitive' } },
        { descricao: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const configuracoes = await prisma.configuracoes.findMany({
      where,
      orderBy: { chave: 'asc' }
    });

    // Converter valores baseado no tipo
    const configuracoesFormatadas = configuracoes.map(config => ({
      ...config,
      valor: converterValor(config.valor, config.tipo)
    }));

    res.json({
      success: true,
      data: configuracoesFormatadas
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/configuracoes/:chave - Buscar configuração por chave
router.get('/:chave', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { chave } = req.params;

    const configuracao = await prisma.configuracoes.findUnique({
      where: { chave }
    });

    if (!configuracao) {
      throw new CustomError('Configuração não encontrada', 404);
    }

    const configuracaoFormatada = {
      ...configuracao,
      valor: converterValor(configuracao.valor, configuracao.tipo)
    };

    res.json({
      success: true,
      data: configuracaoFormatada
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/configuracoes - Criar configuração
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = configuracaoSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Verificar se a chave já existe
    const configuracaoExistente = await prisma.configuracoes.findUnique({
      where: { chave: value.chave }
    });

    if (configuracaoExistente) {
      throw new CustomError('Configuração já existe', 409);
    }

    const configuracao = await prisma.configuracoes.create({
      data: {
        ...value,
        valor: JSON.stringify(value.valor)
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...configuracao,
        valor: converterValor(configuracao.valor, configuracao.tipo)
      },
      message: 'Configuração criada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/configuracoes/:chave - Atualizar configuração
router.put('/:chave', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { chave } = req.params;
    const { error, value } = configuracaoSchema.validate(req.body);

    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const configuracao = await prisma.configuracoes.findUnique({
      where: { chave }
    });

    if (!configuracao) {
      throw new CustomError('Configuração não encontrada', 404);
    }

    const configuracaoAtualizada = await prisma.configuracoes.update({
      where: { chave },
      data: {
        ...value,
        valor: JSON.stringify(value.valor)
      }
    });

    res.json({
      success: true,
      data: {
        ...configuracaoAtualizada,
        valor: converterValor(configuracaoAtualizada.valor, configuracaoAtualizada.tipo)
      },
      message: 'Configuração atualizada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// DELETE /api/configuracoes/:chave - Deletar configuração
router.delete('/:chave', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { chave } = req.params;

    const configuracao = await prisma.configuracoes.findUnique({
      where: { chave }
    });

    if (!configuracao) {
      throw new CustomError('Configuração não encontrada', 404);
    }

    await prisma.configuracoes.delete({
      where: { chave }
    });

    res.json({
      success: true,
      message: 'Configuração deletada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/configuracoes/publicas - Configurações públicas (sem autenticação)
router.get('/publicas/listar', async (req, res, next) => {
  try {
    const configuracoesPublicas = await prisma.configuracoes.findMany({
      where: {
        chave: {
          in: [
            'horario_funcionamento_inicio',
            'horario_funcionamento_fim',
            'dias_funcionamento',
            'tempo_antecedencia_minimo',
            'tempo_antecedencia_maximo',
            'max_consultas_dia_medico'
          ]
        }
      },
      select: {
        chave: true,
        valor: true,
        tipo: true
      }
    });

    const configuracoesFormatadas = configuracoesPublicas.reduce((acc, config) => {
      acc[config.chave] = converterValor(config.valor, config.tipo);
      return acc;
    }, {} as any);

    res.json({
      success: true,
      data: configuracoesFormatadas
    });

  } catch (error) {
    next(error);
  }
});

// Função auxiliar para converter valores
function converterValor(valor: string, tipo: string): any {
  try {
    switch (tipo) {
      case 'number':
        return parseFloat(valor);
      case 'boolean':
        return valor === 'true';
      case 'array':
      case 'object':
        return JSON.parse(valor);
      default:
        return valor;
    }
  } catch (error) {
    return valor;
  }
}

export default router;
