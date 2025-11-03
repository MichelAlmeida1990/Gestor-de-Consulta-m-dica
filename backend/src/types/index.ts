// Tipos principais do sistema

export interface Usuario {
  id: number;
  uuid: string;
  nome: string;
  email: string;
  tipo: 'paciente' | 'medico' | 'admin';
  telefone?: string;
  cpf?: string;
  data_nascimento?: Date;
  endereco?: any;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Medico {
  id: number;
  usuario_id: number;
  crm: string;
  especialidade: string;
  sub_especialidade?: string;
  preco_consulta: number;
  tempo_consulta: number;
  tempo_intervalo: number;
  bio?: string;
  foto_url?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  usuario?: Usuario;
}

export interface Sala {
  id: number;
  nome: string;
  numero?: string;
  andar?: number;
  equipamentos: string[];
  capacidade: number;
  ativa: boolean;
  created_at: Date;
}

export interface HorarioTrabalho {
  id: number;
  medico_id: number;
  dia_semana: number; // 0=domingo, 6=sábado
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
  created_at: Date;
}

export interface HorarioDisponivel {
  id: number;
  medico_id: number;
  sala_id?: number;
  data: Date;
  hora_inicio: string;
  hora_fim: string;
  disponivel: boolean;
  tipo_consulta: string;
  preco?: number;
  created_at: Date;
  medico?: Medico;
  sala?: Sala;
}

export interface Consulta {
  id: number;
  uuid: string;
  paciente_id: number;
  medico_id: number;
  sala_id?: number;
  data: Date;
  hora_inicio: string;
  hora_fim: string;
  tipo_consulta: string;
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'reagendada';
  observacoes?: string;
  sintomas?: string;
  urgencia: number; // 1-5
  preco?: number;
  forma_pagamento?: string;
  created_at: Date;
  updated_at: Date;
  paciente?: Usuario;
  medico?: Medico;
  sala?: Sala;
}

export interface TipoConsulta {
  id: number;
  nome: string;
  duracao: number; // minutos
  preco_base: number;
  descricao?: string;
  ativo: boolean;
  created_at: Date;
}

export interface Configuracao {
  id: number;
  chave: string;
  valor: string;
  descricao?: string;
  tipo: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notificacao {
  id: number;
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_envio: Date;
  data_leitura?: Date;
}

export interface LogAgendamento {
  id: number;
  consulta_id: number;
  acao: string;
  usuario_id?: number;
  detalhes?: any;
  created_at: Date;
}

// ==================== TIPOS FINANCEIROS ====================

export interface Pagamento {
  id: number;
  consulta_id: number;
  valor: number;
  forma_pagamento: string;
  status: 'pendente' | 'pago' | 'cancelado' | 'reembolsado';
  data_pagamento?: Date;
  data_vencimento?: Date;
  observacoes?: string;
  comprovante_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Fatura {
  id: number;
  numero_fatura: string;
  consulta_id: number;
  paciente_id: number;
  medico_id: number;
  valor_total: number;
  valor_desconto: number;
  valor_final: number;
  status: 'pendente' | 'paga' | 'cancelada' | 'vencida';
  data_emissao: Date;
  data_vencimento?: Date;
  data_pagamento?: Date;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Despesa {
  id: number;
  descricao: string;
  categoria: string;
  valor: number;
  data_vencimento?: Date;
  data_pagamento?: Date;
  status: 'pendente' | 'pago' | 'cancelado';
  forma_pagamento?: string;
  observacoes?: string;
  comprovante_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Comissao {
  id: number;
  medico_id: number;
  consulta_id: number;
  valor_consulta: number;
  percentual_comissao: number;
  valor_comissao: number;
  status: 'pendente' | 'pago' | 'cancelado';
  data_pagamento?: Date;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RelatorioFinanceiro {
  id: number;
  tipo: 'mensal' | 'semanal' | 'diario' | 'anual';
  periodo_inicio: Date;
  periodo_fim: Date;
  receita_total: number;
  despesa_total: number;
  lucro_liquido: number;
  total_consultas: number;
  total_pagamentos: number;
  dados_detalhados?: any;
  created_at: Date;
  updated_at: Date;
}

// Tipos para requisições
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  tipo: 'paciente' | 'medico';
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco?: any;
}

export interface AgendamentoRequest {
  medico_id: number;
  data: string;
  hora_inicio: string;
  tipo_consulta: string;
  sintomas?: string;
  urgencia?: number;
  observacoes?: string;
}

export interface BuscaHorariosRequest {
  medico_id?: number;
  especialidade?: string;
  data_inicio: string;
  data_fim: string;
  tipo_consulta?: string;
}

// Tipos para respostas
export interface AuthResponse {
  token: string;
  usuario: Usuario;
  medico?: Medico;
}

export interface HorariosDisponiveisResponse {
  data: string;
  horarios: {
    hora_inicio: string;
    hora_fim: string;
    medico: Medico;
    sala?: Sala;
    preco: number;
  }[];
}

export interface AgendamentoResponse {
  consulta: Consulta;
  mensagem: string;
}

// Tipos para algoritmos de agendamento
export interface CriterioAgendamento {
  urgencia: number;        // 1-10
  preferenciaMedico: number; // 1-5
  proximidade: number;     // 1-5
  disponibilidade: number; // 1-10
  especialidade: number;   // 1-5
}

export interface SugestaoAgendamento {
  medico: Medico;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  sala?: Sala;
  preco: number;
  pontuacao: number;
  motivo: string;
}

// Tipos para estatísticas
export interface EstatisticasMedico {
  medico_id: number;
  total_consultas: number;
  consultas_realizadas: number;
  consultas_canceladas: number;
  taxa_comparecimento: number;
  faturamento_total: number;
  media_pacientes_dia: number;
}

export interface EstatisticasClinica {
  total_pacientes: number;
  total_medicos: number;
  total_consultas_mes: number;
  faturamento_mes: number;
  taxa_ocupacao_salas: number;
  especialidades_mais_procuradas: {
    especialidade: string;
    quantidade: number;
  }[];
}
