// Tipos principais do sistema (compatíveis com o backend)

export interface Usuario {
  id: number;
  uuid: string;
  nome: string;
  email: string;
  tipo: 'paciente' | 'medico' | 'admin';
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco?: any;
  ativo: boolean;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

export interface Consulta {
  id: number;
  uuid: string;
  paciente_id: number;
  medico_id: number;
  sala_id?: number;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  tipo_consulta: string;
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'reagendada';
  observacoes?: string;
  sintomas?: string;
  urgencia: number;
  preco?: number;
  forma_pagamento?: string;
  created_at: string;
  updated_at: string;
  paciente?: Usuario;
  medico?: Medico;
  sala?: Sala;
}

export interface HorarioDisponivel {
  hora_inicio: string;
  hora_fim: string;
  medico: Medico;
  sala?: Sala;
  preco: number;
}

export interface HorariosDisponiveisResponse {
  data: string;
  horarios: HorarioDisponivel[];
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

export interface Notificacao {
  id: number;
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_envio: string;
  data_leitura?: string;
}

// ==================== TIPOS FINANCEIROS ====================

export interface Pagamento {
  id: number;
  consulta_id: number;
  valor: number;
  forma_pagamento: string;
  status: 'pendente' | 'pago' | 'cancelado' | 'reembolsado';
  data_pagamento?: string;
  data_vencimento?: string;
  observacoes?: string;
  comprovante_url?: string;
  created_at: string;
  updated_at: string;
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
  data_emissao: string;
  data_vencimento?: string;
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Despesa {
  id: number;
  descricao: string;
  categoria: string;
  valor: number;
  data_vencimento?: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'cancelado';
  forma_pagamento?: string;
  observacoes?: string;
  comprovante_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Comissao {
  id: number;
  medico_id: number;
  consulta_id: number;
  valor_consulta: number;
  percentual_comissao: number;
  valor_comissao: number;
  status: 'pendente' | 'pago' | 'cancelado';
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface RelatorioFinanceiro {
  id: number;
  tipo: 'mensal' | 'semanal' | 'diario' | 'anual';
  periodo_inicio: string;
  periodo_fim: string;
  receita_total: number;
  despesa_total: number;
  lucro_liquido: number;
  total_consultas: number;
  total_pagamentos: number;
  dados_detalhados?: any;
  created_at: string;
  updated_at: string;
}

// Tipos para formulários
export interface LoginForm {
  email: string;
  senha: string;
}

export interface RegisterForm {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  tipo: 'paciente' | 'medico';
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco?: any;
}

export interface AgendamentoForm {
  medico_id: number;
  data: string;
  hora_inicio: string;
  tipo_consulta: string;
  sintomas?: string;
  urgencia?: number;
  observacoes?: string;
}

export interface BuscaHorariosForm {
  medico_id?: number;
  especialidade?: string;
  data_inicio: string;
  data_fim: string;
  tipo_consulta?: string;
}

// Tipos para respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    statusCode: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Tipos para contexto de autenticação
export interface AuthContextType {
  usuario: Usuario | null;
  medico: Medico | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (dados: RegisterForm) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Tipos para estatísticas
export interface EstatisticasMedico {
  medico: {
    id: number;
    nome: string;
    especialidade: string;
    crm: string;
  };
  periodo_dias: number;
  total_consultas: number;
  consultas_realizadas: number;
  consultas_canceladas: number;
  taxa_comparecimento: number;
  taxa_cancelamento: number;
  faturamento_total: number;
  media_pacientes_dia: number;
}

export interface EstatisticasClinica {
  periodo_dias: number;
  total_consultas: number;
  consultas_realizadas: number;
  consultas_canceladas: number;
  consultas_agendadas: number;
  taxa_comparecimento: number;
  taxa_cancelamento: number;
  faturamento_total: number;
  especialidades_mais_procuradas: {
    tipo_consulta: string;
    quantidade: number;
  }[];
}

// Tipos para configurações
export interface Configuracao {
  id: number;
  chave: string;
  valor: any;
  descricao?: string;
  tipo: string;
  created_at: string;
  updated_at: string;
}

// Tipos para logs
export interface LogAgendamento {
  id: number;
  consulta_id: number;
  acao: string;
  usuario_id?: number;
  detalhes?: any;
  created_at: string;
}
