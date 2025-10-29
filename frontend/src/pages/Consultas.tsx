import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { consultaService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Consulta {
  id: number;
  paciente: { 
    id: number;
    usuario: { nome: string; email: string; telefone?: string };
  };
  medico: { 
    id: number;
    nome?: string; // Compatibilidade
    especialidade: string;
    crm?: string;
    usuario?: { nome: string; email: string; telefone?: string };
  };
  sala?: { nome: string; numero?: string };
  data: string;
  horario: string;
  status: string;
  tipo_consulta: string;
  observacoes?: string;
  urgencia?: string;
  created_at: string;
  updated_at?: string;
}

const Consultas: React.FC = () => {
  const { usuario } = useAuth();
  const [filtros, setFiltros] = useState({
    status: '',
    medico: '',
    data_inicio: '',
    data_fim: '',
    busca: ''
  });
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const queryClient = useQueryClient();

  // Buscar consultas
  const { data: consultasData, isLoading, error, refetch } = useQuery(
    ['consultas', filtros],
    () => consultaService.listar({ 
      page: 1, 
      limit: 50,
      status: filtros.status || undefined,
      data_inicio: filtros.data_inicio || undefined,
      data_fim: filtros.data_fim || undefined,
      busca: filtros.busca || undefined
      // Backend aplica filtros de paciente/medico automaticamente baseado no token
    }),
    { 
      enabled: !!usuario,
      retry: 1,
      refetchOnWindowFocus: true, // Recarregar quando a janela recebe foco
      refetchInterval: false, // Não recarregar automaticamente em intervalo
      onError: (err: any) => {
        console.error('❌ Erro ao buscar consultas:', err);
        console.error('❌ Status:', err.response?.status);
        console.error('❌ Data:', err.response?.data);
      },
      onSuccess: (data) => {
        console.log('✅ Consultas carregadas com sucesso:', data?.data?.consultas?.length || 0, 'consultas');
      }
    }
  );

  const consultas = consultasData?.data?.consultas || [];
  
  // Debug
  useEffect(() => {
    console.log('🔍 Consultas Data:', consultasData);
    console.log('🔍 Consultas Array:', consultas);
    console.log('🔍 Loading:', isLoading);
    console.log('🔍 Error:', error);
    console.log('🔍 Usuario:', usuario);
  }, [consultasData, consultas, isLoading, error, usuario]);

  // Mutação para cancelar consulta
  const cancelarConsultaMutation = useMutation(
    (id: number) => consultaService.cancelar(id, 'Cancelado pelo paciente'),
    {
      onSuccess: () => {
        toast.success('Consulta cancelada com sucesso!');
        queryClient.invalidateQueries('consultas');
        queryClient.invalidateQueries('dashboard-consultas');
        setMostrarDetalhes(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao cancelar consulta');
      }
    }
  );

  // Mutação para confirmar consulta
  const confirmarConsultaMutation = useMutation(
    (id: number) => consultaService.confirmar(id),
    {
      onSuccess: () => {
        toast.success('Consulta confirmada com sucesso!');
        queryClient.invalidateQueries('consultas');
        queryClient.invalidateQueries('dashboard-consultas');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao confirmar consulta');
      }
    }
  );

  const handleVerDetalhes = (consulta: Consulta) => {
    setConsultaSelecionada(consulta);
    setMostrarDetalhes(true);
  };

  const handleCancelar = (id: number) => {
    if (window.confirm('Tem certeza que deseja cancelar esta consulta?')) {
      cancelarConsultaMutation.mutate(id);
    }
  };

  const handleConfirmar = (id: number) => {
    if (window.confirm('Confirmar esta consulta?')) {
      confirmarConsultaMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'bg-blue-100 text-blue-800';
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'realizada':
        return 'bg-gray-100 text-gray-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'agendada':
        return <Calendar className="w-4 h-4" />;
      case 'confirmada':
        return <CheckCircle className="w-4 h-4" />;
      case 'realizada':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getUrgenciaColor = (urgencia?: string) => {
    switch (urgencia) {
      case 'urgente':
        return 'bg-orange-100 text-orange-800';
      case 'emergencia':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-azure-vivido rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Minhas Consultas</h1>
              <p className="text-gray-600">
                {usuario?.tipo === 'paciente' ? 'Gerencie suas consultas agendadas' : 
                 usuario?.tipo === 'medico' ? 'Gerencie sua agenda de consultas' : 
                 'Visualize todas as consultas do sistema'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {consultas.length} consulta{consultas.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Buscar
            </label>
            <input
              type="text"
              value={filtros.busca}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              placeholder="Nome do médico ou paciente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="agendada">Agendada</option>
              <option value="confirmada">Confirmada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={filtros.data_fim}
              onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
            />
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFiltros({ status: '', medico: '', data_inicio: '', data_fim: '', busca: '' })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Lista de Consultas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="w-8 h-8 border-4 border-azure-vivido border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando consultas...</p>
          </div>
        ) : consultas.length === 0 ? (
          <div className="p-4 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma consulta encontrada</h3>
            <p className="text-gray-600">
              {filtros.status || filtros.busca || filtros.data_inicio ? 
                'Tente ajustar os filtros para encontrar consultas.' :
                'Você ainda não possui consultas agendadas.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {consultas.map((consulta: Consulta) => (
              <div 
                key={consulta.id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleVerDetalhes(consulta)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      {/* Status */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consulta.status)}`}>
                        {getStatusIcon(consulta.status)}
                        <span className="ml-1 capitalize">{consulta.status}</span>
                      </span>

                      {/* Urgência */}
                      {consulta.urgencia && consulta.urgencia !== 'normal' && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgenciaColor(consulta.urgencia)}`}>
                          {consulta.urgencia === 'urgente' ? 'Urgente' : 'Emergência'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Médico */}
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {consulta.medico?.usuario?.nome || consulta.medico?.nome || 'Nome não disponível'}
                          </p>
                          <p className="text-xs text-gray-500">{consulta.medico.especialidade || 'Especialidade não informada'}</p>
                        </div>
                      </div>

                      {/* Paciente */}
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {consulta.paciente?.usuario?.nome || 'Nome não disponível'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {consulta.paciente?.usuario?.email || 'Email não disponível'}
                          </p>
                        </div>
                      </div>

                      {/* Data e Horário */}
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(consulta.data).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500">{consulta.horario}</p>
                        </div>
                      </div>

                      {/* Tipo */}
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{consulta.tipo_consulta || consulta.tipo || 'Consulta'}</p>
                          <p className="text-xs text-gray-500">
                            {consulta.sala ? `Sala: ${consulta.sala.nome}${consulta.sala.numero ? ` (${consulta.sala.numero})` : ''}` : 'Sem sala definida'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Observações */}
                    {consulta.observacoes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Observações:</span> {consulta.observacoes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerDetalhes(consulta);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {consulta.status === 'agendada' && usuario?.tipo === 'medico' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmar(consulta.id);
                        }}
                        disabled={confirmarConsultaMutation.isLoading}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Confirmar consulta"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    {(consulta.status === 'agendada' || consulta.status === 'confirmada') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelar(consulta.id);
                        }}
                        disabled={cancelarConsultaMutation.isLoading}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Cancelar consulta"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {mostrarDetalhes && consultaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Detalhes da Consulta</h3>
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status e Urgência */}
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(consultaSelecionada.status)}`}>
                    {getStatusIcon(consultaSelecionada.status)}
                    <span className="ml-2 capitalize">{consultaSelecionada.status}</span>
                  </span>
                  
                  {consultaSelecionada.urgencia && consultaSelecionada.urgencia !== 'normal' && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUrgenciaColor(consultaSelecionada.urgencia)}`}>
                      {consultaSelecionada.urgencia === 'urgente' ? 'Urgente' : 'Emergência'}
                    </span>
                  )}
                </div>

                {/* Informações da Consulta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Médico</h4>
                    <p className="text-gray-700">
                      {consultaSelecionada.medico?.usuario?.nome || consultaSelecionada.medico?.nome || 'Nome não disponível'}
                    </p>
                    <p className="text-sm text-gray-500">{consultaSelecionada.medico.especialidade || 'Especialidade não informada'}</p>
                    {consultaSelecionada.medico?.crm && (
                      <p className="text-xs text-gray-400">CRM: {consultaSelecionada.medico.crm}</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Paciente</h4>
                    <p className="text-gray-700">
                      {consultaSelecionada.paciente?.usuario?.nome || 'Nome não disponível'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {consultaSelecionada.paciente?.usuario?.email || 'Email não disponível'}
                    </p>
                    {consultaSelecionada.paciente?.usuario?.telefone && (
                      <p className="text-xs text-gray-400">Telefone: {consultaSelecionada.paciente.usuario.telefone}</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Data e Horário</h4>
                    <p className="text-gray-700">
                      {new Date(consultaSelecionada.data).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-500">{consultaSelecionada.horario}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tipo de Consulta</h4>
                    <p className="text-gray-700">{consultaSelecionada.tipo_consulta || consultaSelecionada.tipo || 'Consulta'}</p>
                  </div>

                  {consultaSelecionada.sala && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Sala</h4>
                      <p className="text-gray-700">{consultaSelecionada.sala.nome}</p>
                      {consultaSelecionada.sala.numero && (
                        <p className="text-sm text-gray-500">Número: {consultaSelecionada.sala.numero}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Observações */}
                {consultaSelecionada.observacoes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{consultaSelecionada.observacoes}</p>
                    </div>
                  </div>
                )}

                {/* Data de Criação */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Agendada em</h4>
                  <p className="text-gray-700">
                    {new Date(consultaSelecionada.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Fechar
                </button>

                {consultaSelecionada.status === 'agendada' && usuario?.tipo === 'medico' && (
                  <button
                    onClick={() => {
                      handleConfirmar(consultaSelecionada.id);
                      setMostrarDetalhes(false);
                    }}
                    disabled={confirmarConsultaMutation.isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Confirmar Consulta
                  </button>
                )}

                {(consultaSelecionada.status === 'agendada' || consultaSelecionada.status === 'confirmada') && (
                  <button
                    onClick={() => {
                      handleCancelar(consultaSelecionada.id);
                      setMostrarDetalhes(false);
                    }}
                    disabled={cancelarConsultaMutation.isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Cancelar Consulta
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultas;
