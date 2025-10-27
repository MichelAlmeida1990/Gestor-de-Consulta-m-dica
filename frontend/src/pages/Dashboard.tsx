import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { consultaService, notificacaoService } from '../services/api';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Bell, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { usuario, medico } = useAuth();

  // Buscar estatísticas do usuário
  const { data: consultasData } = useQuery(
    'dashboard-consultas',
    () => consultaService.listar({ 
      page: 1, 
      limit: 5,
      ...(usuario?.tipo === 'paciente' ? { paciente_id: usuario.id } : {}),
      ...(usuario?.tipo === 'medico' ? { medico_id: medico?.id } : {})
    }),
    { enabled: !!usuario }
  );

  const { data: notificacoesData } = useQuery(
    'dashboard-notificacoes',
    () => notificacaoService.listar({ page: 1, limit: 5 }),
    { enabled: !!usuario }
  );

  const consultas = consultasData?.data?.consultas || [];
  const notificacoes = notificacoesData?.data?.notificacoes || [];

  // Calcular estatísticas rápidas
  const consultasAgendadas = consultas.filter(c => c.status === 'agendada').length;
  const consultasConfirmadas = consultas.filter(c => c.status === 'confirmada').length;
  const consultasRealizadas = consultas.filter(c => c.status === 'realizada').length;
  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'agendada':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'confirmada':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'realizada':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
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
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-azul-principal to-azure-vivido rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-lg text-white/80">Visão geral do sistema</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consultas Agendadas</p>
              <p className="text-2xl font-bold text-gray-900">{consultasAgendadas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmadas</p>
              <p className="text-2xl font-bold text-gray-900">{consultasConfirmadas}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Realizadas</p>
              <p className="text-2xl font-bold text-gray-900">{consultasRealizadas}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Notificações</p>
              <p className="text-2xl font-bold text-gray-900">{notificacoesNaoLidas}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximas consultas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
              <Calendar className="w-6 h-6 mr-3 text-azure-vivido" />
              Próximas Consultas
            </h2>
            {consultas.length > 0 ? (
              <div className="space-y-3">
                {consultas.slice(0, 3).map((consulta) => (
                  <div key={consulta.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(consulta.status)}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {usuario?.tipo === 'paciente' 
                            ? consulta.medico?.usuario?.nome
                            : consulta.paciente?.nome
                          }
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(consulta.data).toLocaleDateString('pt-BR')} às {consulta.hora_inicio}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consulta.status)}`}>
                      {consulta.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma consulta encontrada</p>
              </div>
            )}
          </div>
        </div>

        {/* Notificações recentes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
              <Bell className="w-6 h-6 mr-3 text-azure-vivido" />
              Notificações Recentes
            </h2>
            {notificacoes.length > 0 ? (
              <div className="space-y-3">
                {notificacoes.slice(0, 3).map((notificacao) => (
                  <div key={notificacao.id} className={`p-3 rounded-lg ${!notificacao.lida ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{notificacao.titulo}</p>
                        <p className="text-xs text-gray-600 mt-1">{notificacao.mensagem}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notificacao.data_envio).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button className="flex items-center justify-center p-3 bg-azure-vivido text-white rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            Nova Consulta
          </button>
          <button className="flex items-center justify-center p-3 bg-verde-botao text-preto-fundo rounded-lg hover:opacity-90 transition-opacity text-sm">
            <User className="w-4 h-4 mr-2" />
            Ver Médicos
          </button>
          <button className="flex items-center justify-center p-3 bg-gray-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm sm:col-span-2 lg:col-span-1">
            <Clock className="w-4 h-4 mr-2" />
            Minhas Consultas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
