import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { CustomError, handleDatabaseError } from '../middleware/errorHandler';
import { authenticate, requireMedico, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Schemas de validação
const createMedicoSchema = Joi.object({
  usuario_id: Joi.number().integer().positive().required(),
  crm: Joi.string().required(),
  especialidade: Joi.string().required(),
  sub_especialidade: Joi.string().optional(),
  preco_consulta: Joi.number().positive().required(),
  tempo_consulta: Joi.number().integer().min(15).max(120).default(30),
  tempo_intervalo: Joi.number().integer().min(5).max(60).default(15),
  bio: Joi.string().optional(),
  foto_url: Joi.string().uri().optional()
});

const updateMedicoSchema = Joi.object({
  especialidade: Joi.string().optional(),
  sub_especialidade: Joi.string().optional(),
  preco_consulta: Joi.number().positive().optional(),
  tempo_consulta: Joi.number().integer().min(15).max(120).optional(),
  tempo_intervalo: Joi.number().integer().min(5).max(60).optional(),
  bio: Joi.string().optional(),
  foto_url: Joi.string().uri().optional(),
  ativo: Joi.boolean().optional()
});

const horarioTrabalhoSchema = Joi.object({
  dia_semana: Joi.number().integer().min(0).max(6).required(),
  hora_inicio: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  hora_fim: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
});

// GET /api/medicos - Listar médicos
router.get('/', async (req, res, next) => {
  try {
    const { especialidade, ativo, search } = req.query;

    const where: any = {};
    
    if (especialidade) {
      where.especialidade = { contains: especialidade as string, mode: 'insensitive' };
    }
    
    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    if (search) {
      where.usuario = {
        nome: { contains: search as string, mode: 'insensitive' }
      };
    }

    const medicos = await prisma.medicos.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            ativo: true
          }
        },
        horarios_trabalho: {
          where: { ativo: true },
          orderBy: { dia_semana: 'asc' }
        },
        _count: {
          select: {
            consultas: {
              where: {
                data: { gte: new Date() },
                status: { in: ['agendada', 'confirmada'] }
              }
            }
          }
        }
      },
      orderBy: { especialidade: 'asc' }
    });

    res.json({
      success: true,
      data: medicos
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/medicos/:id - Buscar médico por ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const medico = await prisma.medicos.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: true,
        horarios_trabalho: {
          where: { ativo: true },
          orderBy: { dia_semana: 'asc' }
        },
        consultas: {
          where: {
            data: { gte: new Date() },
            status: { in: ['agendada', 'confirmada'] }
          },
          include: {
            paciente: {
              select: {
                id: true,
                nome: true,
                telefone: true
              }
            },
            sala: true
          },
          orderBy: { data: 'asc' }
        }
      }
    });

    if (!medico) {
      throw new CustomError('Médico não encontrado', 404);
    }

    res.json({
      success: true,
      data: medico
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/medicos - Criar médico (apenas admin)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = createMedicoSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Verificar se o usuário existe e é do tipo médico
    const usuario = await prisma.usuarios.findUnique({
      where: { id: value.usuario_id }
    });

    if (!usuario) {
      throw new CustomError('Usuário não encontrado', 404);
    }

    if (usuario.tipo !== 'medico') {
      throw new CustomError('Usuário deve ser do tipo médico', 400);
    }

    // Verificar se já existe médico para este usuário
    const medicoExistente = await prisma.medicos.findFirst({
      where: { usuario_id: value.usuario_id }
    });

    if (medicoExistente) {
      throw new CustomError('Usuário já possui cadastro de médico', 409);
    }

    // Verificar se CRM já existe
    const crmExistente = await prisma.medicos.findUnique({
      where: { crm: value.crm }
    });

    if (crmExistente) {
      throw new CustomError('CRM já cadastrado', 409);
    }

    const medico = await prisma.medicos.create({
      data: value,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: medico,
      message: 'Médico cadastrado com sucesso'
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      next(handleDatabaseError(error));
    } else {
      next(error);
    }
  }
});

// PUT /api/medicos/:id - Atualizar médico
router.put('/:id', authenticate, requireMedico, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateMedicoSchema.validate(req.body);

    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const medico = await prisma.medicos.findUnique({
      where: { id: parseInt(id) }
    });

    if (!medico) {
      throw new CustomError('Médico não encontrado', 404);
    }

    // Verificar se o usuário pode editar este médico
    if (req.usuario!.tipo !== 'admin' && req.usuario!.id !== medico.usuario_id) {
      throw new CustomError('Acesso negado', 403);
    }

    const medicoAtualizado = await prisma.medicos.update({
      where: { id: parseInt(id) },
      data: value,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: medicoAtualizado,
      message: 'Médico atualizado com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/medicos/:id/horarios - Adicionar horário de trabalho
router.post('/:id/horarios', authenticate, requireMedico, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = horarioTrabalhoSchema.validate(req.body);

    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const medico = await prisma.medicos.findUnique({
      where: { id: parseInt(id) }
    });

    if (!medico) {
      throw new CustomError('Médico não encontrado', 404);
    }

    // Verificar se o usuário pode editar este médico
    if (req.usuario!.tipo !== 'admin' && req.usuario!.id !== medico.usuario_id) {
      throw new CustomError('Acesso negado', 403);
    }

    // Verificar se já existe horário para este dia
    const horarioExistente = await prisma.horarios_trabalho.findFirst({
      where: {
        medico_id: parseInt(id),
        dia_semana: value.dia_semana,
        ativo: true
      }
    });

    if (horarioExistente) {
      throw new CustomError('Já existe horário cadastrado para este dia da semana', 409);
    }

    const horario = await prisma.horarios_trabalho.create({
      data: {
        medico_id: parseInt(id),
        ...value
      }
    });

    res.status(201).json({
      success: true,
      data: horario,
      message: 'Horário de trabalho adicionado com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/medicos/:id/horarios/:horarioId - Atualizar horário de trabalho
router.put('/:id/horarios/:horarioId', authenticate, requireMedico, async (req, res, next) => {
  try {
    const { id, horarioId } = req.params;
    const { error, value } = horarioTrabalhoSchema.validate(req.body);

    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const medico = await prisma.medicos.findUnique({
      where: { id: parseInt(id) }
    });

    if (!medico) {
      throw new CustomError('Médico não encontrado', 404);
    }

    // Verificar se o usuário pode editar este médico
    if (req.usuario!.tipo !== 'admin' && req.usuario!.id !== medico.usuario_id) {
      throw new CustomError('Acesso negado', 403);
    }

    const horario = await prisma.horarios_trabalho.findFirst({
      where: {
        id: parseInt(horarioId),
        medico_id: parseInt(id)
      }
    });

    if (!horario) {
      throw new CustomError('Horário não encontrado', 404);
    }

    const horarioAtualizado = await prisma.horarios_trabalho.update({
      where: { id: parseInt(horarioId) },
      data: value
    });

    res.json({
      success: true,
      data: horarioAtualizado,
      message: 'Horário de trabalho atualizado com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// DELETE /api/medicos/:id/horarios/:horarioId - Remover horário de trabalho
router.delete('/:id/horarios/:horarioId', authenticate, requireMedico, async (req, res, next) => {
  try {
    const { id, horarioId } = req.params;

    const medico = await prisma.medicos.findUnique({
      where: { id: parseInt(id) }
    });

    if (!medico) {
      throw new CustomError('Médico não encontrado', 404);
    }

    // Verificar se o usuário pode editar este médico
    if (req.usuario!.tipo !== 'admin' && req.usuario!.id !== medico.usuario_id) {
      throw new CustomError('Acesso negado', 403);
    }

    const horario = await prisma.horarios_trabalho.findFirst({
      where: {
        id: parseInt(horarioId),
        medico_id: parseInt(id)
      }
    });

    if (!horario) {
      throw new CustomError('Horário não encontrado', 404);
    }

    await prisma.horarios_trabalho.update({
      where: { id: parseInt(horarioId) },
      data: { ativo: false }
    });

    res.json({
      success: true,
      message: 'Horário de trabalho removido com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/medicos/:id/estatisticas - Estatísticas do médico
router.get('/:id/estatisticas', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { periodo = '30' } = req.query;
    const dias = parseInt(periodo as string);
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const medico = await prisma.medicos.findUnique({
      where: { id: parseInt(id) },
      include: { usuario: true }
    });

    if (!medico) {
      throw new CustomError('Médico não encontrado', 404);
    }

    const [
      totalConsultas,
      consultasRealizadas,
      consultasCanceladas,
      faturamentoTotal,
      mediaPacientesDia
    ] = await Promise.all([
      prisma.consultas.count({
        where: {
          medico_id: parseInt(id),
          data: { gte: dataInicio }
        }
      }),
      prisma.consultas.count({
        where: {
          medico_id: parseInt(id),
          data: { gte: dataInicio },
          status: 'realizada'
        }
      }),
      prisma.consultas.count({
        where: {
          medico_id: parseInt(id),
          data: { gte: dataInicio },
          status: 'cancelada'
        }
      }),
      prisma.consultas.aggregate({
        where: {
          medico_id: parseInt(id),
          data: { gte: dataInicio },
          status: 'realizada'
        },
        _sum: { preco: true }
      }),
      prisma.consultas.groupBy({
        by: ['data'],
        where: {
          medico_id: parseInt(id),
          data: { gte: dataInicio },
          status: 'realizada'
        },
        _count: { data: true },
        _avg: { preco: true }
      })
    ]);

    const taxaComparecimento = totalConsultas > 0 ? (consultasRealizadas / totalConsultas) * 100 : 0;
    const taxaCancelamento = totalConsultas > 0 ? (consultasCanceladas / totalConsultas) * 100 : 0;
    const mediaPacientes = mediaPacientesDia.length > 0 
      ? mediaPacientesDia.reduce((sum, day) => sum + day._count.data, 0) / mediaPacientesDia.length 
      : 0;

    res.json({
      success: true,
      data: {
        medico: {
          id: medico.id,
          nome: medico.usuario.nome,
          especialidade: medico.especialidade,
          crm: medico.crm
        },
        periodo_dias: dias,
        total_consultas: totalConsultas,
        consultas_realizadas: consultasRealizadas,
        consultas_canceladas: consultasCanceladas,
        taxa_comparecimento: Math.round(taxaComparecimento * 100) / 100,
        taxa_cancelamento: Math.round(taxaCancelamento * 100) / 100,
        faturamento_total: faturamentoTotal._sum.preco || 0,
        media_pacientes_dia: Math.round(mediaPacientes * 100) / 100
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;
