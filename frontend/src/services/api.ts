import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// Configuração base da API - FORÇADA para porta 3001
const API_BASE_URL = 'http://localhost:3001/api';

// Log da configuração para debug
console.log('🔗 API Base URL:', API_BASE_URL);

// Criar instância do axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const tokenData = localStorage.getItem('token');
    
    if (tokenData) {
      try {
        // Tentar parsear como objeto com timestamp
        const parsed = JSON.parse(tokenData);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch {
        // Token é string simples - usar direto
        config.headers.Authorization = `Bearer ${tokenData}`;
      }
      
      // Log para debug
      console.log('🔑 Token enviado na requisição:', config.headers.Authorization?.substring(0, 30) + '...');
    } else {
      console.log('⚠️ Nenhum token encontrado no localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Flag para evitar múltiplos redirecionamentos (persiste entre requisições)
let isRedirecting = false;
let redirectTimeout: NodeJS.Timeout | null = null;

// Flag para indicar que acabou de fazer login (evita toast de sessão expirada imediatamente)
let justLoggedIn = false;
let justLoggedInTimeout: NodeJS.Timeout | null = null;

// Função para marcar que acabou de fazer login
export const setJustLoggedIn = () => {
  console.log('✅ setJustLoggedIn chamado - ignorando erros 401 por 5 segundos');
  justLoggedIn = true;
  if (justLoggedInTimeout) {
    clearTimeout(justLoggedInTimeout);
  }
  // Remover flag após 5 segundos (tempo suficiente para todas as requisições após login e inicialização)
  justLoggedInTimeout = setTimeout(() => {
    justLoggedIn = false;
    console.log('⏰ Flag justLoggedIn expirada - erros 401 agora serão processados normalmente');
  }, 5000);
};

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error('❌ Response interceptor error:', error);
    console.error('❌ Response interceptor error status:', error.response?.status);
    console.error('❌ Response interceptor error data:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      console.log('🔐 Token inválido ou expirado detectado');
      
      // NÃO limpar se for requisição de login ou register (esses endpoints podem retornar 401 normalmente)
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                             error.config?.url?.includes('/auth/register');
      
      if (isAuthEndpoint) {
        // É uma requisição de login/register que falhou - não limpar token
        console.log('🔐 Erro 401 em endpoint de autenticação, não limpando token');
        return Promise.reject(error);
      }
      
      // Só limpar se não estiver já na página de login ou register
      // e se não estiver já redirecionando
      const currentPath = window.location.pathname;
      const isPublicRoute = currentPath === '/login' || currentPath === '/register';
      
      // NÃO limpar nem mostrar toast se acabou de fazer login (evita conflito)
      if (justLoggedIn) {
        console.log('🔐 Erro 401 detectado logo após login, ignorando...');
        return Promise.reject(error);
      }
      
      // TEMPORARIAMENTE DESABILITADO - Backend está retornando 401 incorretamente
      // Não limpar token automaticamente até que o problema do backend seja resolvido
      console.log('⚠️ Erro 401 detectado, mas NÃO limpando token (backend precisa ser corrigido)');
      console.log('⚠️ URL da requisição:', error.config?.url);
      return Promise.reject(error);
      
      /* CÓDIGO DESABILITADO TEMPORARIAMENTE - REABILITAR QUANDO BACKEND ESTIVER CORRIGIDO
      if (!isPublicRoute && !isRedirecting) {
        console.log('🔄 Limpando dados de autenticação');
        isRedirecting = true;
        
        // Limpar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('medico');
        
        // Disparar evento customizado para notificar o AuthContext
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'session_expired' } }));
        
        // Resetar flag após um tempo para permitir novo redirecionamento se necessário
        if (redirectTimeout) {
          clearTimeout(redirectTimeout);
        }
        redirectTimeout = setTimeout(() => {
          isRedirecting = false;
        }, 5000);
        
        toast.error('Sessão expirada. Faça login novamente.');
      }
      */
    } else if (error.response?.status === 403) {
      toast.error('Acesso negado. Você não tem permissão para esta ação.');
    } else if (error.response?.status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.');
    } else if (error.response?.data?.error?.message) {
      toast.error(error.response.data.error.message);
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('Erro inesperado. Tente novamente.');
    }
    
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  async login(email: string, senha: string) {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  },

  async register(dados: any) {
    const response = await api.post('/auth/register', dados);
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async getMe() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      // Se falhar, provavelmente token inválido
      throw error;
    }
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

// Serviços de usuários
export const usuarioService = {
  async listar(params?: any) {
    const response = await api.get('/usuarios', { params });
    return response.data;
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  async atualizar(id: number, dados: any) {
    const response = await api.put(`/usuarios/${id}`, dados);
    return response.data;
  },

  async alterarSenha(id: number, dados: any) {
    const response = await api.put(`/usuarios/${id}/senha`, dados);
    return response.data;
  },

  async alterarStatus(id: number, ativo: boolean) {
    const response = await api.put(`/usuarios/${id}/status`, { ativo });
    return response.data;
  },

  async deletar(id: number) {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },

  async listarConsultas(id: number, params?: any) {
    const response = await api.get(`/usuarios/${id}/consultas`, { params });
    return response.data;
  },
};

// Serviços de médicos
export const medicoService = {
  async listar(params?: any) {
    try {
      const response = await api.get('/medicos', { params });
      return response.data;
    } catch (error) {
      console.error('❌ medicoService.listar - Erro:', error);
      throw error;
    }
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/medicos/${id}`);
    return response.data;
  },

  async criar(dados: any) {
    const response = await api.post('/medicos', dados);
    return response.data;
  },

  async atualizar(id: number, dados: any) {
    const response = await api.put(`/medicos/${id}`, dados);
    return response.data;
  },

  async adicionarHorario(id: number, dados: any) {
    const response = await api.post(`/medicos/${id}/horarios`, dados);
    return response.data;
  },

  async atualizarHorario(id: number, horarioId: number, dados: any) {
    const response = await api.put(`/medicos/${id}/horarios/${horarioId}`, dados);
    return response.data;
  },

  async removerHorario(id: number, horarioId: number) {
    const response = await api.delete(`/medicos/${id}/horarios/${horarioId}`);
    return response.data;
  },

  async getEstatisticas(id: number, periodo?: number) {
    const response = await api.get(`/medicos/${id}/estatisticas`, { 
      params: { periodo } 
    });
    return response.data;
  },

  async alterarStatus(id: number, ativo: boolean) {
    const response = await api.put(`/medicos/${id}/status`, { ativo });
    return response.data;
  },

  async deletar(id: number) {
    const response = await api.delete(`/medicos/${id}`);
    return response.data;
  },
};

// Serviços de consultas
export const consultaService = {
  async listar(params?: any) {
    const response = await api.get('/consultas', { params });
    return response.data;
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/consultas/${id}`);
    return response.data;
  },

  async criar(dados: any) {
    const response = await api.post('/consultas', dados);
    return response.data;
  },

  async atualizar(id: number, dados: any) {
    const response = await api.put(`/consultas/${id}`, dados);
    return response.data;
  },

  async cancelar(id: number, motivo?: string) {
    const response = await api.post(`/consultas/${id}/cancelar`, { motivo });
    return response.data;
  },

  async confirmar(id: number) {
    const response = await api.post(`/consultas/${id}/confirmar`);
    return response.data;
  },

  async reagendar(id: number, dados: any) {
    const response = await api.post(`/consultas/${id}/reagendar`, dados);
    return response.data;
  },

  async getEstatisticas(periodo?: number) {
    const response = await api.get('/consultas/estatisticas/geral', { 
      params: { periodo } 
    });
    return response.data;
  },
};

// Serviços de agendamento
export const agendamentoService = {
  async sugerirHorarios(dados: any) {
    const response = await api.post('/agendamento/sugerir', dados);
    return response.data;
  },

  async buscarHorarios(dados: any) {
    const response = await api.post('/agendamento/buscar-horarios', dados);
    return response.data;
  },

  async agendar(dados: any) {
    const response = await api.post('/agendamento/agendar', dados);
    return response.data;
  },
};

// Serviços de salas
export const salaService = {
  async listar(params?: any) {
    const response = await api.get('/salas', { params });
    return response.data;
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/salas/${id}`);
    return response.data;
  },

  async criar(dados: any) {
    const response = await api.post('/salas', dados);
    return response.data;
  },

  async atualizar(id: number, dados: any) {
    const response = await api.put(`/salas/${id}`, dados);
    return response.data;
  },

  async alterarStatus(id: number, ativa: boolean) {
    const response = await api.put(`/salas/${id}/status`, { ativa });
    return response.data;
  },

  async deletar(id: number) {
    const response = await api.delete(`/salas/${id}`);
    return response.data;
  },

  async verificarDisponibilidade(params: any) {
    const response = await api.get('/salas/disponibilidade/verificar', { params });
    return response.data;
  },
};

// Serviços de notificações
export const notificacaoService = {
  async listar(params?: any) {
    const response = await api.get('/notificacoes', { params });
    return response.data;
  },

  async getNaoLidas() {
    const response = await api.get('/notificacoes/nao-lidas');
    return response.data;
  },

  async marcarComoLida(id: number) {
    const response = await api.put(`/notificacoes/${id}/marcar-lida`);
    return response.data;
  },

  async marcarTodasComoLidas() {
    const response = await api.put('/notificacoes/marcar-todas-lidas');
    return response.data;
  },

  async deletar(id: number) {
    const response = await api.delete(`/notificacoes/${id}`);
    return response.data;
  },

  async limparLidas() {
    const response = await api.delete('/notificacoes/limpar-lidas');
    return response.data;
  },

  async enviar(dados: any) {
    const response = await api.post('/notificacoes/enviar', dados);
    return response.data;
  },

  async enviarMassa(dados: any) {
    const response = await api.post('/notificacoes/enviar-massa', dados);
    return response.data;
  },
};

// Serviços de configurações
export const configuracaoService = {
  async listar(params?: any) {
    const response = await api.get('/configuracoes', { params });
    return response.data;
  },

  async buscarPorChave(chave: string) {
    const response = await api.get(`/configuracoes/${chave}`);
    return response.data;
  },

  async criar(dados: any) {
    const response = await api.post('/configuracoes', dados);
    return response.data;
  },

  async atualizar(chave: string, dados: any) {
    const response = await api.put(`/configuracoes/${chave}`, dados);
    return response.data;
  },

  async deletar(chave: string) {
    const response = await api.delete(`/configuracoes/${chave}`);
    return response.data;
  },

  async getPublicas() {
    const response = await api.get('/configuracoes/publicas/listar');
    return response.data;
  },
};

// ===== SERVIÇO DO PRONTUÁRIO ELETRÔNICO =====

export const prontuarioService = {
  async listar(params?: any) {
    const response = await api.get('/prontuarios', { params });
    return response.data;
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/prontuarios/${id}`);
    return response.data;
  },

  async criar(dados: any) {
    const response = await api.post('/prontuarios', dados);
    return response.data;
  },

  async atualizar(id: number, dados: any) {
    const response = await api.put(`/prontuarios/${id}`, dados);
    return response.data;
  },

  async deletar(id: number) {
    const response = await api.delete(`/prontuarios/${id}`);
    return response.data;
  },

  async buscarPorPaciente(pacienteId: number) {
    const response = await api.get('/prontuarios', { 
      params: { paciente_id: pacienteId } 
    });
    return response.data;
  },

  async buscarPorConsulta(consultaId: number) {
    const response = await api.get('/prontuarios', { 
      params: { consulta_id: consultaId } 
    });
    return response.data;
  }
};

// ===== SERVIÇO DE PACIENTES =====

export const pacienteService = {
  async listar(params?: any) {
    const response = await api.get('/pacientes', { params });
    return response.data;
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/pacientes/${id}`);
    return response.data;
  },

  async criar(dados: any) {
    const response = await api.post('/pacientes', dados);
    return response.data;
  },

  async atualizar(id: number, dados: any) {
    const response = await api.put(`/pacientes/${id}`, dados);
    return response.data;
  },

  async deletar(id: number) {
    const response = await api.delete(`/pacientes/${id}`);
    return response.data;
  }
};

// Tornar setJustLoggedIn disponível globalmente via window
if (typeof window !== 'undefined') {
  (window as any).setJustLoggedIn = setJustLoggedIn;
}

export default api;
