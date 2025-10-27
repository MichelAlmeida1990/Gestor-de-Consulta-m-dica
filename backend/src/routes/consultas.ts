import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { CustomError, handleDatabaseError } from '../middleware/errorHandler';
import { authenticate, requireMedicoOrOwnership, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Schemas de validação
const updateConsultaSchema = Joi.object({
  status: Joi.string().valid('agendada', 'confirmada', 'realizada', 'cancelada', 'reagendada').optional(),
  observacoes: Joi.string().optional(),
  sintomas: Joi.string().optional(),
  urgencia: Joi.number().integer().min(1).max(5).optional(),
  forma_pagamento: Joi.string().optional()
});

const reagendamentoSchema = Joi.object({
  nova_data: Joi.date().min('now').required(),
  nova_hora_inicio: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  motivo: Joi.string().optional()
});

// GET /api/consultas - Listar consultas
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      medico_id, 
      paciente_id, 
      data_inicio, 
      data_fim,
      tipo_consulta 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    // Filtros baseados no tipo de usuário
    if (req.usuario!.tipo === 'paciente') {
      where.paciente_id = req.usuario!.id;
    } else if (req.usuario!.tipo === 'medico') {
      where.medico_id = req.usuario!.id;
    }

    // Filtros adicionais
    if (status) where.status = status;
    if (medico_id) where.medico_id = parseInt(medico_id as string);
    if (paciente_id) where.paciente_id = parseInt(paciente_id as string);
    if (tipo_consulta) where.tipo_consulta = tipo_consulta;
    
    if (data_inicio) where.data = { gte: new Date(data_inicio as string) };
    if (data_fim) where.data = { lte: new Date(data_fim as string) };

    const [consultas, total] = await Promise.all([
      prisma.consultas.findMany({
        where,
        skip,
        take,
        include: {
          paciente: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true
            }
          },
          medico: {
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

// GET /api/consultas/:id - Buscar consulta por ID
router.get('/:id', authenticate, requireMedicoOrOwnership, async (req, res, next) => {
  try {
    const { id } = req.params;

    const consulta = await prisma.consultas.findUnique({
      where: { id: parseInt(id) },
      include: {
        paciente: true,
        medico: {
          include: {
            usuario: true
          }
        },
        sala: true
      }
    });

    if (!consulta) {
      throw new CustomError('Consulta não encontrada', 404);
    }

    res.json({
      success: true,
      data: consulta
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/consultas/:id - Atualizar consulta
router.put('/:id', authenticate, requireMedicoOrOwnership, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateConsultaSchema.validate(req.body);

    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const consulta = await prisma.consultas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!consulta) {
      throw new CustomError('Consulta não encontrada', 404);
    }

    const consultaAtualizada = await prisma.consultas.update({
      where: { id: parseInt(id) },
      data: value,
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        medico: {
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
        },
        sala: true
      }
    });

    // Log da atualização
    await prisma.logs_agendamento.create({
      data: {
        consulta_id: parseInt(id),
        acao: 'consulta_atualizada',
        usuario_id: req.usuario!.id,
        detalhes: {
          campos_alterados: value,
          usuario: req.usuario!.nome
        }
      }
    });

    res.json({
      success: true,
      data: consultaAtualizada,
      message: 'Consulta atualizada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/consultas/:id/cancelar - Cancelar consulta
router.post('/:id/cancelar', authenticate, requireMedicoOrOwnership, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const consulta = await prisma.consultas.findUnique({
      where: { id: parseInt(id) },
      include: {
        paciente: true,
        medico: {
          include: { usuario: true }
        }
      }
    });

    if (!consulta) {
      throw new CustomError('Consulta não encontrada', 404);
    }

    if (consulta.status === 'cancelada') {
      throw new CustomError('Consulta já está cancelada', 400);
    }

    if (consulta.status === 'realizada') {
      throw new CustomError('Não é possível cancelar consulta já realizada', 400);
    }

    // Atualizar status da consulta
    const consultaCancelada = await prisma.consultas.update({
      where: { id: parseInt(id) },
      data: {
        status: 'cancelada',
        observacoes: motivo ? `${consulta.observacoes || ''}\nCancelamento: ${motivo}`.trim() : consulta.observacoes
      }
    });

    // Liberar horário
    await prisma.horarios_disponiveis.updateMany({
      where: {
        medico_id: consulta.medico_id,
        data: consulta.data,
        hora_inicio: consulta.hora_inicio
      },
      data: { disponivel: true }
    });

    // Criar notificação para o paciente
    await prisma.notificacoes.create({
      data: {
        usuario_id: consulta.paciente_id,
        tipo: 'cancelamento',
        titulo: 'Consulta Cancelada',
        mensagem: `Sua consulta com ${consulta.medico.usuario.nome} foi cancelada. ${motivo ? `Motivo: ${motivo}` : ''}`
      }
    });

    // Log do cancelamento
    await prisma.logs_agendamento.create({
      data: {
        consulta_id: parseInt(id),
        acao: 'consulta_cancelada',
        usuario_id: req.usuario!.id,
        detalhes: {
          motivo,
          usuario: req.usuario!.nome,
          paciente: consulta.paciente.nome,
          medico: consulta.medico.usuario.nome
        }
      }
    });

    res.json({
      success: true,
      data: consultaCancelada,
      message: 'Consulta cancelada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/consultas/:id/reagendar - Reagendar consulta
router.post('/:id/reagendar', authenticate, requireMedicoOrOwnership, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = reagendamentoSchema.validate(req.body);

    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const { nova_data, nova_hora_inicio, motivo } = value;

    const consulta = await prisma.consultas.findUnique({
      where: { id: parseInt(id) },
      include: {
        medico: true,
        paciente: true
      }
    });

    if (!consulta) {
      throw new CustomError('Consulta não encontrada', 404);
    }

    if (consulta.status === 'realizada') {
      throw new CustomError('Não é possível reagendar consulta já realizada', 400);
    }

    if (consulta.status === 'cancelada') {
      throw new CustomError('Não é possível reagendar consulta cancelada', 400);
    }

    // Verificar se o novo horário está disponível
    const horarioDisponivel = await prisma.horarios_disponiveis.findFirst({
      where: {
        medico_id: consulta.medico_id,
        data: new Date(nova_data),
        hora_inicio: nova_hora_inicio,
        disponivel: true
      }
    });

    if (!horarioDisponivel) {
      throw new CustomError('Novo horário não disponível', 409);
    }

    // Calcular nova hora fim
    const novaHoraFim = new Date(`${nova_data} ${nova_hora_inicio}`);
    novaHoraFim.setMinutes(novaHoraFim.getMinutes() + consulta.medico.tempo_consulta);

    // Liberar horário antigo
    await prisma.horarios_disponiveis.updateMany({
      where: {
        medico_id: consulta.medico_id,
        data: consulta.data,
        hora_inicio: consulta.hora_inicio
      },
      data: { disponivel: true }
    });

    // Atualizar consulta
    const consultaReagendada = await prisma.consultas.update({
      where: { id: parseInt(id) },
      data: {
        data: new Date(nova_data),
        hora_inicio: nova_hora_inicio,
        hora_fim: novaHoraFim.toTimeString().slice(0, 5),
        status: 'reagendada',
        observacoes: motivo ? `${consulta.observacoes || ''}\nReagendamento: ${motivo}`.trim() : consulta.observacoes
      }
    });

    // Marcar novo horário como indisponível
    await prisma.horarios_disponiveis.update({
      where: { id: horarioDisponivel.id },
      data: { disponivel: false }
    });

    // Criar notificação
    await prisma.notificacoes.create({
      data: {
        usuario_id: consulta.paciente_id,
        tipo: 'reagendamento',
        titulo: 'Consulta Reagendada',
        mensagem: `Sua consulta foi reagendada para ${new Date(nova_data).toLocaleDateString('pt-BR')} às ${nova_hora_inicio}. ${motivo ? `Motivo: ${motivo}` : ''}`
      }
    });

    // Log do reagendamento
    await prisma.logs_agendamento.create({
      data: {
        consulta_id: parseInt(id),
        acao: 'consulta_reagendada',
        usuario_id: req.usuario!.id,
        detalhes: {
          data_anterior: consulta.data,
          hora_anterior: consulta.hora_inicio,
          nova_data,
          nova_hora: nova_hora_inicio,
          motivo,
          usuario: req.usuario!.nome
        }
      }
    });

    res.json({
      success: true,
      data: consultaReagendada,
      message: 'Consulta reagendada com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/consultas/estatisticas - Estatísticas das consultas
router.get('/estatisticas/geral', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { periodo = '30' } = req.query;
    const dias = parseInt(periodo as string);
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const [
      totalConsultas,
      consultasRealizadas,
      consultasCanceladas,
      consultasAgendadas,
      faturamentoTotal,
      especialidadesMaisProcuradas
    ] = await Promise.all([
      prisma.consultas.count({
        where: { data: { gte: dataInicio } }
      }),
      prisma.consultas.count({
        where: { 
          data: { gte: dataInicio },
          status: 'realizada'
        }
      }),
      prisma.consultas.count({
        where: { 
          data: { gte: dataInicio },
          status: 'cancelada'
        }
      }),
      prisma.consultas.count({
        where: { 
          data: { gte: dataInicio },
          status: { in: ['agendada', 'confirmada'] }
        }
      }),
      prisma.consultas.aggregate({
        where: { 
          data: { gte: dataInicio },
          status: 'realizada'
        },
        _sum: { preco: true }
      }),
      prisma.consultas.groupBy({
        by: ['tipo_consulta'],
        where: { data: { gte: dataInicio } },
        _count: { tipo_consulta: true },
        orderBy: { _count: { tipo_consulta: 'desc' } },
        take: 5
      })
    ]);

    const taxaComparecimento = totalConsultas > 0 ? (consultasRealizadas / totalConsultas) * 100 : 0;
    const taxaCancelamento = totalConsultas > 0 ? (consultasCanceladas / totalConsultas) * 100 : 0;

    res.json({
      success: true,
      data: {
        periodo_dias: dias,
        total_consultas: totalConsultas,
        consultas_realizadas: consultasRealizadas,
        consultas_canceladas: consultasCanceladas,
        consultas_agendadas: consultasAgendadas,
        taxa_comparecimento: Math.round(taxaComparecimento * 100) / 100,
        taxa_cancelamento: Math.round(taxaCancelamento * 100) / 100,
        faturamento_total: faturamentoTotal._sum.preco || 0,
        especialidades_mais_procuradas: especialidadesMaisProcuradas.map(item => ({
          tipo_consulta: item.tipo_consulta,
          quantidade: item._count.tipo_consulta
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;
