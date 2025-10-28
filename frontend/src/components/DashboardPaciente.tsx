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
  const { data: consultasData } = useQuery(
    'paciente-dashboard-consultas',
    () => consultaService.listar({ 
      page: 1, 
      limit: 10,
      paciente_id: usuario?.id
    }),
    { enabled: !!usuario?.id }
  );

  const { data: notificacoesData } = useQuery(
    'paciente-dashboard-notificacoes',
    () => notificacaoService.listar({ page: 1, limit: 5 }),
    { enabled: !!usuario }
  );

  const consultas = Array.isArray(consultasData?.data?.consultas) ? consultasData.data.consultas : 
                   Array.isArray(consultasData?.data) ? consultasData.data : [];
  const notificacoes = Array.isArray(notificacoesData?.data) ? notificacoesData.data : [];

  // Calcular estatísticas
  const totalConsultas = consultas.length;
  const consultasHoje = consultas.filter(c => 
    new Date(c.data).toDateString() === new Date().toDateString()
  ).length;
  const consultasAgendadas = consultas.filter(c => c.status === 'agendada').length;
  const consultasConfirmadas = consultas.filter(c => c.status === 'confirmada').length;
  const consultasCanceladas = consultas.filter(c => c.status === 'cancelada').length;

  // Próximas consultas (próximos 7 dias)
  const proximasConsultas = consultas.filter(c => {
    const dataConsulta = new Date(c.data);
    const hoje = new Date();
    const proximos7Dias = new Date();
    proximos7Dias.setDate(hoje.getDate() + 7);
    
    return dataConsulta >= hoje && dataConsulta <= proximos7Dias && c.status !== 'cancelada';
  }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

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
        {/* Total de Consultas */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Consultas</p>
              <p className="text-3xl font-bold text-gray-900">{totalConsultas}</p>
              <p className="text-xs text-gray-500 mt-1">Suas consultas</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Consultas Hoje */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Hoje</p>
              <p className="text-3xl font-bold text-gray-900">{consultasHoje}</p>
              <p className="text-xs text-gray-500 mt-1">Consultas de hoje</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Próximas Consultas */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Próximos 7 dias</p>
              <p className="text-3xl font-bold text-gray-900">{proximasConsultas.length}</p>
              <p className="text-xs text-gray-500 mt-1">Consultas agendadas</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Notificações</p>
              <p className="text-3xl font-bold text-gray-900">{notificacoes.length}</p>
              <p className="text-xs text-gray-500 mt-1">Mensagens pendentes</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg">
              <Bell className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Ação Rápida */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/agendamento"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agendar Consulta
          </Link>
          <Link
            to="/consultas"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Ver Minhas Consultas
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
          <h3 className="text-lg font-medium text-gray-900">Próximas Consultas</h3>
        </div>
        <div className="p-6">
          {proximasConsultas.length > 0 ? (
            <div className="space-y-4">
              {proximasConsultas.slice(0, 5).map((consulta: any) => (
                <div key={consulta.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Stethoscope className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{consulta.medico?.nome}</p>
                      <p className="text-sm text-gray-600">{consulta.tipo_consulta}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{consulta.data}</p>
                    <p className="text-sm text-gray-600">{consulta.horario}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nenhuma consulta agendada para os próximos 7 dias</p>
              <Link
                to="/agendamento"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
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
