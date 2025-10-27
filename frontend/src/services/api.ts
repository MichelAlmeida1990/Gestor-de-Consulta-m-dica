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
        // Token é string simples
        config.headers.Authorization = `Bearer ${tokenData}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('medico');
      window.location.href = '/login';
      toast.error('Sessão expirada. Faça login novamente.');
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
    const response = await api.get('/auth/me');
    return response.data;
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
    const response = await api.get('/medicos', { params });
    return response.data;
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

export default api;
