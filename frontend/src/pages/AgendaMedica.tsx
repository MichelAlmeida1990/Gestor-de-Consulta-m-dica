import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Eye
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
}

const AgendaMedica: React.FC = () => {
  const { usuario, medico } = useAuth();
  const queryClient = useQueryClient();
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  // Horários de trabalho (8h às 18h)
  const horarios = Array.from({ length: 21 }, (_, i) => {
    const hora = 8 + Math.floor(i / 2);
    const minuto = i % 2 === 0 ? '00' : '30';
    return `${hora.toString().padStart(2, '0')}:${minuto}`;
  });

  // Formatar data para busca (YYYY-MM-DD)
  const formatarDataParaBusca = (data: Date): string => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  // Buscar consultas do médico para a data selecionada
  const { data: consultasData, isLoading, refetch } = useQuery(
    ['agenda-medica', dataSelecionada],
    () => consultaService.listar({ 
      page: 1, 
      limit: 100,
      data_inicio: formatarDataParaBusca(dataSelecionada),
      data_fim: formatarDataParaBusca(dataSelecionada)
      // Backend filtra automaticamente por medico_id baseado no token
    }),
    { 
      enabled: !!usuario,
      onSuccess: (data) => {
        console.log('✅ Consultas da agenda carregadas:', data?.data?.consultas?.length || 0);
      },
      onError: (error) => {
        console.error('❌ Erro ao carregar consultas da agenda:', error);
      }
    }
  );

  // Tratar resposta da API
  let consultas: Consulta[] = [];
  if (consultasData?.success && consultasData?.data) {
    if (Array.isArray(consultasData.data)) {
      consultas = consultasData.data;
    } else if (consultasData.data.consultas && Array.isArray(consultasData.data.consultas)) {
      consultas = consultasData.data.consultas;
    }
  }

  // Filtrar consultas do dia e ordenar por horário
  const consultasDoDia = consultas
    .filter((c: Consulta) => {
      const dataConsulta = new Date(c.data);
      return dataConsulta.toDateString() === dataSelecionada.toDateString();
    })
    .sort((a: Consulta, b: Consulta) => {
      const horaA = a.horario.split(':').map(Number);
      const horaB = b.horario.split(':').map(Number);
      const tempoA = horaA[0] * 60 + horaA[1];
      const tempoB = horaB[0] * 60 + horaB[1];
      return tempoA - tempoB;
    });

  // Agrupar consultas por horário para visualização
  const consultasPorHorario: { [key: string]: Consulta[] } = {};
  consultasDoDia.forEach((consulta) => {
    if (!consultasPorHorario[consulta.horario]) {
      consultasPorHorario[consulta.horario] = [];
    }
    consultasPorHorario[consulta.horario].push(consulta);
  });

  // Navegar entre datas
  const navegarData = (direcao: 'anterior' | 'proximo') => {
    const novaData = new Date(dataSelecionada);
    if (direcao === 'anterior') {
      novaData.setDate(novaData.getDate() - 1);
    } else {
      novaData.setDate(novaData.getDate() + 1);
    }
    setDataSelecionada(novaData);
  };

  // Ir para hoje
  const irParaHoje = () => {
    setDataSelecionada(new Date());
  };

  // Ver detalhes da consulta
  const handleVerDetalhes = (consulta: Consulta) => {
    setConsultaSelecionada(consulta);
    setMostrarDetalhes(true);
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmada':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'realizada':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'agendada':
        return <AlertCircle className="w-4 h-4" />;
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

  // Obter cor de urgência
  const getUrgenciaColor = (urgencia?: string) => {
    switch (urgencia) {
      case 'urgente':
        return 'bg-orange-500';
      case 'emergencia':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Verificar se é hoje
  const hoje = new Date();
  const ehHoje = dataSelecionada.toDateString() === hoje.toDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agenda Médica</h1>
              <p className="text-gray-600">
                {usuario?.nome} - {medico?.especialidade || 'Especialidade não definida'}
              </p>
            </div>
          </div>
          
          {/* Navegação de Data */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navegarData('anterior')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={formatarDataParaBusca(dataSelecionada)}
                onChange={(e) => setDataSelecionada(new Date(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={irParaHoje}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  ehHoje 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hoje
              </button>
            </div>
            
            <button
              onClick={() => navegarData('proximo')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Próximo dia"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Estatísticas do dia */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total do dia</p>
                <p className="text-2xl font-bold text-gray-900">{consultasDoDia.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {consultasDoDia.filter((c) => c.status === 'agendada').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {consultasDoDia.filter((c) => c.status === 'confirmada').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Canceladas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {consultasDoDia.filter((c) => c.status === 'cancelada').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Agenda em Grade */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando agenda...</p>
          </div>
        ) : consultasDoDia.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma consulta agendada</h3>
            <p className="text-gray-600">
              {ehHoje 
                ? 'Você não tem consultas agendadas para hoje.' 
                : `Você não tem consultas agendadas para ${dataSelecionada.toLocaleDateString('pt-BR')}.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {horarios.map((horario) => {
              const consultasNoHorario = consultasPorHorario[horario] || [];
              const isHorarioPassado = (() => {
                if (!ehHoje) return false;
                const [hora, minuto] = horario.split(':').map(Number);
                const agora = new Date();
                const horarioConsulta = new Date();
                horarioConsulta.setHours(hora, minuto, 0, 0);
                return horarioConsulta < agora;
              })();

              return (
                <div
                  key={horario}
                  className={`p-4 transition-colors ${
                    isHorarioPassado ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Horário */}
                    <div className="w-20 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-4 h-4 ${isHorarioPassado ? 'text-gray-400' : 'text-green-600'}`} />
                        <span className={`font-semibold ${isHorarioPassado ? 'text-gray-400' : 'text-gray-900'}`}>
                          {horario}
                        </span>
                      </div>
                    </div>

                    {/* Consultas */}
                    <div className="flex-1 space-y-2">
                      {consultasNoHorario.length > 0 ? (
                        consultasNoHorario.map((consulta) => (
                          <div
                            key={consulta.id}
                            onClick={() => handleVerDetalhes(consulta)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                              getStatusColor(consulta.status)
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <User className="w-5 h-5" />
                                  <h4 className="font-bold text-lg">
                                    {consulta.paciente?.usuario?.nome || 'Nome não disponível'}
                                  </h4>
                                  {consulta.urgencia && consulta.urgencia !== 'normal' && (
                                    <span
                                      className={`w-3 h-3 rounded-full ${getUrgenciaColor(consulta.urgencia)}`}
                                      title={consulta.urgencia === 'urgente' ? 'Urgente' : 'Emergência'}
                                    />
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Stethoscope className="w-4 h-4 text-gray-500" />
                                    <span>{consulta.tipo_consulta || 'Consulta'}</span>
                                  </div>
                                  {consulta.sala && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="w-4 h-4 text-gray-500" />
                                      <span>
                                        {consulta.sala.nome}
                                        {consulta.sala.numero && ` - Sala ${consulta.sala.numero}`}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {consulta.observacoes && (
                                  <div className="mt-2 flex items-start space-x-2">
                                    <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <p className="text-sm text-gray-700 line-clamp-2">{consulta.observacoes}</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(consulta.status)}`}>
                                  {getStatusIcon(consulta.status)}
                                  <span className="ml-1 capitalize">{consulta.status}</span>
                                </span>
                                <Eye className="w-4 h-4 text-gray-500" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm py-2">Sem consultas</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {mostrarDetalhes && consultaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Consulta</h2>
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações do Paciente */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Paciente
                </h3>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">
                    {consultaSelecionada.paciente?.usuario?.nome || 'Nome não disponível'}
                  </p>
                  {consultaSelecionada.paciente?.usuario?.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{consultaSelecionada.paciente.usuario.email}</span>
                    </div>
                  )}
                  {consultaSelecionada.paciente?.usuario?.telefone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{consultaSelecionada.paciente.usuario.telefone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações da Consulta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Data</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(consultaSelecionada.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Horário</p>
                  <p className="font-semibold text-gray-900">{consultaSelecionada.horario}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Tipo</p>
                  <p className="font-semibold text-gray-900">{consultaSelecionada.tipo_consulta || 'Consulta'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(consultaSelecionada.status)}`}>
                    {getStatusIcon(consultaSelecionada.status)}
                    <span className="ml-1 capitalize">{consultaSelecionada.status}</span>
                  </span>
                </div>
                {consultaSelecionada.sala && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Sala</p>
                    <p className="font-semibold text-gray-900">
                      {consultaSelecionada.sala.nome}
                      {consultaSelecionada.sala.numero && ` - Sala ${consultaSelecionada.sala.numero}`}
                    </p>
                  </div>
                )}
                {consultaSelecionada.urgencia && consultaSelecionada.urgencia !== 'normal' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Urgência</p>
                    <p className="font-semibold text-gray-900 capitalize">{consultaSelecionada.urgencia}</p>
                  </div>
                )}
              </div>

              {/* Observações */}
              {consultaSelecionada.observacoes && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">Observações</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{consultaSelecionada.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaMedica;

