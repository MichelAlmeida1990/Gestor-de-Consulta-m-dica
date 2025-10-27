import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import moment from 'moment';
import { CustomError, handleDatabaseError } from '../middleware/errorHandler';
import { authenticate, requireMedicoOrOwnership } from '../middleware/auth';
import { 
  AgendamentoRequest, 
  BuscaHorariosRequest, 
  HorariosDisponiveisResponse,
  SugestaoAgendamento,
  CriterioAgendamento 
} from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Schemas de validação
const agendamentoSchema = Joi.object({
  medico_id: Joi.number().integer().positive().required(),
  data: Joi.date().min('now').required(),
  hora_inicio: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  tipo_consulta: Joi.string().required(),
  sintomas: Joi.string().optional(),
  urgencia: Joi.number().integer().min(1).max(5).default(3),
  observacoes: Joi.string().optional()
});

const buscaHorariosSchema = Joi.object({
  medico_id: Joi.number().integer().positive().optional(),
  especialidade: Joi.string().optional(),
  data_inicio: Joi.date().min('now').required(),
  data_fim: Joi.date().min(Joi.ref('data_inicio')).required(),
  tipo_consulta: Joi.string().optional()
});

// POST /api/agendamento/sugerir - Sugerir melhor horário automaticamente
router.post('/sugerir', authenticate, async (req, res, next) => {
  try {
    const { especialidade, tipo_consulta, urgencia = 3, preferencia_medico, data_preferencia } = req.body;

    if (!especialidade) {
      throw new CustomError('Especialidade é obrigatória', 400);
    }

    // Buscar médicos da especialidade
    const medicos = await prisma.medicos.findMany({
      where: {
        especialidade: { contains: especialidade, mode: 'insensitive' },
        ativo: true
      },
      include: {
        usuario: true,
        horarios_trabalho: {
          where: { ativo: true }
        }
      }
    });

    if (medicos.length === 0) {
      throw new CustomError('Nenhum médico encontrado para esta especialidade', 404);
    }

    // Calcular período de busca (próximos 30 dias)
    const dataInicio = data_preferencia ? moment(data_preferencia) : moment();
    const dataFim = dataInicio.clone().add(30, 'days');

    const sugestoes: SugestaoAgendamento[] = [];

    // Para cada médico, buscar horários disponíveis
    for (const medico of medicos) {
      const horariosDisponiveis = await buscarHorariosDisponiveis(
        medico.id,
        dataInicio.format('YYYY-MM-DD'),
        dataFim.format('YYYY-MM-DD'),
        tipo_consulta
      );

      // Calcular pontuação para cada horário
      for (const horario of horariosDisponiveis) {
        const criterios: CriterioAgendamento = {
          urgencia: urgencia,
          preferenciaMedico: preferencia_medico === medico.id ? 5 : 1,
          proximidade: 3, // Valor padrão
          disponibilidade: 10, // Horário está disponível
          especialidade: 5 // Especialidade correta
        };

        const pontuacao = calcularPontuacao(criterios);
        
        sugestoes.push({
          medico,
          data: horario.data,
          hora_inicio: horario.hora_inicio,
          hora_fim: horario.hora_fim,
          sala: horario.sala,
          preco: horario.preco || medico.preco_consulta,
          pontuacao,
          motivo: gerarMotivoSugestao(criterios, medico)
        });
      }
    }

    // Ordenar por pontuação (maior primeiro)
    sugestoes.sort((a, b) => b.pontuacao - a.pontuacao);

    // Retornar top 5 sugestões
    const topSugestoes = sugestoes.slice(0, 5);

    res.json({
      success: true,
      data: topSugestoes,
      message: 'Sugestões de agendamento geradas com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/agendamento/buscar-horarios - Buscar horários disponíveis
router.post('/buscar-horarios', authenticate, async (req, res, next) => {
  try {
    const { error, value } = buscaHorariosSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const { medico_id, especialidade, data_inicio, data_fim, tipo_consulta }: BuscaHorariosRequest = value;

    let medicos;

    if (medico_id) {
      // Buscar horários de um médico específico
      const medico = await prisma.medicos.findUnique({
        where: { id: medico_id },
        include: { usuario: true }
      });

      if (!medico) {
        throw new CustomError('Médico não encontrado', 404);
      }

      medicos = [medico];
    } else if (especialidade) {
      // Buscar médicos por especialidade
      medicos = await prisma.medicos.findMany({
        where: {
          especialidade: { contains: especialidade, mode: 'insensitive' },
          ativo: true
        },
        include: { usuario: true }
      });
    } else {
      throw new CustomError('Médico ou especialidade deve ser informado', 400);
    }

    if (medicos.length === 0) {
      throw new CustomError('Nenhum médico encontrado', 404);
    }

    const horariosDisponiveis: HorariosDisponiveisResponse[] = [];

    // Para cada médico, buscar horários disponíveis
    for (const medico of medicos) {
      const horarios = await buscarHorariosDisponiveis(
        medico.id,
        moment(data_inicio).format('YYYY-MM-DD'),
        moment(data_fim).format('YYYY-MM-DD'),
        tipo_consulta
      );

      // Agrupar por data
      const horariosPorData = horarios.reduce((acc, horario) => {
        const data = moment(horario.data).format('YYYY-MM-DD');
        if (!acc[data]) {
          acc[data] = [];
        }
        acc[data].push({
          hora_inicio: horario.hora_inicio,
          hora_fim: horario.hora_fim,
          medico,
          sala: horario.sala,
          preco: horario.preco || medico.preco_consulta
        });
        return acc;
      }, {} as any);

      // Converter para array
      Object.keys(horariosPorData).forEach(data => {
        horariosDisponiveis.push({
          data,
          horarios: horariosPorData[data]
        });
      });
    }

    // Ordenar por data
    horariosDisponiveis.sort((a, b) => moment(a.data).diff(moment(b.data)));

    res.json({
      success: true,
      data: horariosDisponiveis,
      message: 'Horários disponíveis encontrados'
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/agendamento/agendar - Agendar consulta
router.post('/agendar', authenticate, async (req, res, next) => {
  try {
    const { error, value } = agendamentoSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const dados: AgendamentoRequest = value;
    const pacienteId = req.usuario!.id;

    // Verificar se o médico existe e está ativo
    const medico = await prisma.medicos.findUnique({
      where: { id: dados.medico_id },
      include: { usuario: true }
    });

    if (!medico || !medico.ativo) {
      throw new CustomError('Médico não encontrado ou inativo', 404);
    }

    // Verificar se o horário está disponível
    const horarioDisponivel = await prisma.horarios_disponiveis.findFirst({
      where: {
        medico_id: dados.medico_id,
        data: new Date(dados.data),
        hora_inicio: dados.hora_inicio,
        disponivel: true
      },
      include: { sala: true }
    });

    if (!horarioDisponivel) {
      throw new CustomError('Horário não disponível', 409);
    }

    // Calcular hora fim baseada no tempo de consulta
    const horaFim = moment(`${dados.data} ${dados.hora_inicio}`)
      .add(medico.tempo_consulta, 'minutes')
      .format('HH:mm');

    // Verificar conflitos
    const conflito = await prisma.consultas.findFirst({
      where: {
        medico_id: dados.medico_id,
        data: new Date(dados.data),
        status: { in: ['agendada', 'confirmada'] },
        OR: [
          {
            AND: [
              { hora_inicio: { lte: dados.hora_inicio } },
              { hora_fim: { gt: dados.hora_inicio } }
            ]
          },
          {
            AND: [
              { hora_inicio: { lt: horaFim } },
              { hora_fim: { gte: horaFim } }
            ]
          }
        ]
      }
    });

    if (conflito) {
      throw new CustomError('Horário já ocupado', 409);
    }

    // Criar consulta
    const consulta = await prisma.consultas.create({
      data: {
        paciente_id: pacienteId,
        medico_id: dados.medico_id,
        sala_id: horarioDisponivel.sala_id,
        data: new Date(dados.data),
        hora_inicio: dados.hora_inicio,
        hora_fim: horaFim,
        tipo_consulta: dados.tipo_consulta,
        sintomas: dados.sintomas,
        urgencia: dados.urgencia,
        observacoes: dados.observacoes,
        preco: medico.preco_consulta,
        status: 'agendada'
      },
      include: {
        medico: {
          include: { usuario: true }
        },
        sala: true
      }
    });

    // Marcar horário como indisponível
    await prisma.horarios_disponiveis.update({
      where: { id: horarioDisponivel.id },
      data: { disponivel: false }
    });

    // Criar notificação
    await prisma.notificacoes.create({
      data: {
        usuario_id: pacienteId,
        tipo: 'agendamento',
        titulo: 'Consulta Agendada',
        mensagem: `Sua consulta com ${medico.usuario.nome} foi agendada para ${moment(dados.data).format('DD/MM/YYYY')} às ${dados.hora_inicio}`
      }
    });

    // Log do agendamento
    await prisma.logs_agendamento.create({
      data: {
        consulta_id: consulta.id,
        acao: 'agendamento_criado',
        usuario_id: pacienteId,
        detalhes: {
          dados_agendamento: dados,
          medico: medico.usuario.nome,
          sala: horarioDisponivel.sala?.nome
        }
      }
    });

    res.status(201).json({
      success: true,
      data: consulta,
      message: 'Consulta agendada com sucesso'
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      next(handleDatabaseError(error));
    } else {
      next(error);
    }
  }
});

// Função auxiliar para buscar horários disponíveis
async function buscarHorariosDisponiveis(
  medicoId: number,
  dataInicio: string,
  dataFim: string,
  tipoConsulta?: string
) {
  const horarios = await prisma.horarios_disponiveis.findMany({
    where: {
      medico_id: medicoId,
      data: {
        gte: new Date(dataInicio),
        lte: new Date(dataFim)
      },
      disponivel: true,
      ...(tipoConsulta && { tipo_consulta: tipoConsulta })
    },
    include: {
      sala: true
    },
    orderBy: [
      { data: 'asc' },
      { hora_inicio: 'asc' }
    ]
  });

  return horarios;
}

// Função para calcular pontuação de sugestão
function calcularPontuacao(criterios: CriterioAgendamento): number {
  const pesos = {
    urgencia: 0.3,
    preferenciaMedico: 0.2,
    proximidade: 0.1,
    disponibilidade: 0.2,
    especialidade: 0.2
  };

  return Object.keys(criterios).reduce((total, criterio) => {
    return total + (criterios[criterio as keyof CriterioAgendamento] * pesos[criterio as keyof typeof pesos]);
  }, 0);
}

// Função para gerar motivo da sugestão
function gerarMotivoSugestao(criterios: CriterioAgendamento, medico: any): string {
  const motivos = [];

  if (criterios.urgencia >= 4) {
    motivos.push('Alta urgência');
  }

  if (criterios.preferenciaMedico === 5) {
    motivos.push('Médico preferido');
  }

  if (criterios.especialidade === 5) {
    motivos.push('Especialidade correta');
  }

  if (criterios.disponibilidade === 10) {
    motivos.push('Horário disponível');
  }

  return motivos.length > 0 ? motivos.join(', ') : 'Horário disponível';
}

export default router;
