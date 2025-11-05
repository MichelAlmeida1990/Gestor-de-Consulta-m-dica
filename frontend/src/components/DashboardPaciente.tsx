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
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPaciente: React.FC = () => {
  const { usuario } = useAuth();

  // Buscar consultas do paciente
  // O backend filtra automaticamente por paciente_id baseado no token
  // Não precisa passar paciente_id, o backend já filtra pelo usuário logado
  const { data: consultasData } = useQuery(
    'paciente-dashboard-consultas',
    () => consultaService.listar({ 
      page: 1, 
      limit: 10
      // Não passar paciente_id - o backend filtra automaticamente pelo token
    }),
    { 
      enabled: !!usuario?.id,
      onSuccess: (data) => {
        console.log('✅ Dashboard - Consultas carregadas:', data?.data?.consultas?.length || 0, 'consultas');
      },
      onError: (error) => {
        console.error('❌ Dashboard - Erro ao carregar consultas:', error);
      }
    }
  );

  const { data: notificacoesData } = useQuery(
    'paciente-dashboard-notificacoes',
    () => notificacaoService.listar({ page: 1, limit: 5 }),
    { enabled: !!usuario }
  );

  // Tratar resposta da API - pode vir em diferentes formatos
  let consultas: any[] = [];
  if (consultasData?.success && consultasData?.data) {
    if (Array.isArray(consultasData.data)) {
      consultas = consultasData.data;
    } else if (consultasData.data.consultas && Array.isArray(consultasData.data.consultas)) {
      consultas = consultasData.data.consultas;
    }
  }
  
  const notificacoes = Array.isArray(notificacoesData?.data) ? notificacoesData.data : [];
  
  // Debug
  React.useEffect(() => {
    console.log('🔍 Dashboard - Consultas Data:', consultasData);
    console.log('🔍 Dashboard - Consultas Array:', consultas);
    console.log('🔍 Dashboard - Quantidade de consultas:', consultas.length);
  }, [consultasData, consultas]);

  // Calcular estatísticas específicas para o paciente
  const consultasHoje = consultas.filter((c: any) => 
    new Date(c.data).toDateString() === new Date().toDateString()
  ).length;
  const consultasAgendadas = consultas.filter((c: any) => c.status === 'agendada').length;
  const consultasConfirmadas = consultas.filter((c: any) => c.status === 'confirmada').length;
  const consultasRealizadas = consultas.filter((c: any) => c.status === 'realizada').length;
  const consultasCanceladas = consultas.filter((c: any) => c.status === 'cancelada').length;
  
  // Consultas que precisam de confirmação (agendadas há mais de 24h)
  const consultasParaConfirmar = consultas.filter((c: any) => {
    if (c.status !== 'agendada') return false;
    const dataConsulta = new Date(c.data);
    const hoje = new Date();
    const diferencaDias = Math.ceil((dataConsulta.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diferencaDias <= 2 && diferencaDias >= 0; // Próximos 2 dias
  }).length;

  // Próximas consultas (próximos 7 dias)
  const proximasConsultas = consultas.filter((c: any) => {
    const dataConsulta = new Date(c.data);
    const hoje = new Date();
    const proximos7Dias = new Date();
    proximos7Dias.setDate(hoje.getDate() + 7);
    
    return dataConsulta >= hoje && dataConsulta <= proximos7Dias && c.status !== 'cancelada';
  }).sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-4 flex items-center">
                <span className="text-5xl mr-4">👤</span>
                Meu Painel
              </h1>
              <p className="text-xl text-purple-100 mb-2">
                Bem-vindo, {usuario?.nome}!
              </p>
              <p className="text-purple-200">
                Gerencie suas consultas médicas de forma simples
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-6xl">❤️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Consultas Agendadas */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Agendadas</p>
              <p className="text-3xl font-bold text-gray-900">{consultasAgendadas}</p>
              <p className="text-xs text-gray-500 mt-1">Aguardando confirmação</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Consultas Confirmadas */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Confirmadas</p>
              <p className="text-3xl font-bold text-gray-900">{consultasConfirmadas}</p>
              <p className="text-xs text-gray-500 mt-1">Prontas para atendimento</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Consultas Hoje */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Hoje</p>
              <p className="text-3xl font-bold text-gray-900">{consultasHoje}</p>
              <p className="text-xs text-gray-500 mt-1">Consultas de hoje</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Consultas Realizadas */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Realizadas</p>
              <p className="text-3xl font-bold text-gray-900">{consultasRealizadas}</p>
              <p className="text-xs text-gray-500 mt-1">Consultas concluídas</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerta para Confirmações Pendentes */}
      {consultasParaConfirmar > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <p className="font-semibold text-yellow-800">
                Você tem {consultasParaConfirmar} consulta(s) que precisam de confirmação!
              </p>
              <p className="text-sm text-yellow-700">
                Confirme suas consultas para garantir que não sejam canceladas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">⚡</span>
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/agendamento"
            className="group bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Agendar Consulta</p>
                <p className="text-blue-100 text-sm">Nova consulta</p>
              </div>
              <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
          
          <Link
            to="/consultas"
            className="group bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Minhas Consultas</p>
                <p className="text-green-100 text-sm">Ver todas</p>
              </div>
              <Calendar className="h-6 w-6 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
          
          <Link
            to="/perfil"
            className="group bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Meu Perfil</p>
                <p className="text-purple-100 text-sm">Editar dados</p>
              </div>
              <User className="h-6 w-6 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
          
          <Link
            to="/notificacoes"
            className="group bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Notificações</p>
                <p className="text-orange-100 text-sm">{notificacoes.length} mensagens</p>
              </div>
              <Bell className="h-6 w-6 group-hover:scale-110 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Status das Consultas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmadas</p>
              <p className="text-xl font-bold text-gray-900">{consultasConfirmadas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agendadas</p>
              <p className="text-xl font-bold text-gray-900">{consultasAgendadas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Canceladas</p>
              <p className="text-xl font-bold text-gray-900">{consultasCanceladas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Próximas Consultas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="text-2xl mr-2">📅</span>
            Próximas Consultas
          </h3>
        </div>
        <div className="p-6">
          {proximasConsultas.length > 0 ? (
            <div className="space-y-4">
              {proximasConsultas.slice(0, 5).map((consulta: any) => (
                <div key={consulta.id} className="group bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <Stethoscope className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {consulta.medico?.usuario?.nome || consulta.medico?.nome || 'Nome não disponível'}
                        </p>
                        <p className="text-sm text-gray-600">{consulta.medico?.especialidade || 'Especialidade não informada'}</p>
                        <p className="text-xs text-gray-500">{consulta.tipo_consulta || consulta.tipo || 'Consulta'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(consulta.data).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-600">{consulta.horario}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          consulta.status === 'agendada' ? 'bg-blue-100 text-blue-800' :
                          consulta.status === 'confirmada' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {consulta.status === 'agendada' ? '⏳ Agendada' :
                           consulta.status === 'confirmada' ? '✅ Confirmada' :
                           consulta.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ações para consultas agendadas */}
                  {consulta.status === 'agendada' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors">
                        ✅ Confirmar
                      </button>
                      <button className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors">
                        ❌ Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4 text-lg">Nenhuma consulta agendada para os próximos 7 dias</p>
              <p className="text-gray-400 mb-6">Que tal agendar uma nova consulta?</p>
              <Link
                to="/agendamento"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agendar Nova Consulta
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPaciente;
