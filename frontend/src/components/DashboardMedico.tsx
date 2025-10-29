import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { consultaService, notificacaoService } from '../services/api';
import { 
  Calendar, 
  Clock, 
  User, 
  Bell, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Users
} from 'lucide-react';

const DashboardMedico: React.FC = () => {
  const { usuario, medico } = useAuth();

  // Buscar consultas do médico
  const { data: consultasData } = useQuery(
    'medico-dashboard-consultas',
    () => consultaService.listar({ 
      page: 1, 
      limit: 10,
      medico_id: medico?.id || usuario?.id
    }),
    { enabled: !!(medico?.id || usuario?.id) }
  );

  const { data: notificacoesData } = useQuery(
    'medico-dashboard-notificacoes',
    () => notificacaoService.listar({ page: 1, limit: 5 }),
    { enabled: !!usuario }
  );

  const consultas = Array.isArray(consultasData?.data?.consultas) ? consultasData.data.consultas : 
                   Array.isArray(consultasData?.data) ? consultasData.data : [];
  const notificacoes = Array.isArray(notificacoesData?.data) ? notificacoesData.data : [];

  // Calcular estatísticas
  const totalConsultas = consultas.length;
  const consultasHoje = consultas.filter((c: any) => 
    new Date(c.data).toDateString() === new Date().toDateString()
  ).length;
  const consultasAgendadas = consultas.filter((c: any) => c.status === 'agendada').length;
  const consultasConfirmadas = consultas.filter((c: any) => c.status === 'confirmada').length;
  const consultasCanceladas = consultas.filter((c: any) => c.status === 'cancelada').length;

  // Próximas consultas (próximos 7 dias)
  const proximasConsultas = consultas.filter((c: any) => {
    const dataConsulta = new Date(c.data);
    const hoje = new Date();
    const proximos7Dias = new Date();
    proximos7Dias.setDate(hoje.getDate() + 7);
    
    return dataConsulta >= hoje && dataConsulta <= proximos7Dias && c.status !== 'cancelada';
  }).sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-700 via-emerald-700 to-teal-800 rounded-2xl shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-4 flex items-center">
                <span className="text-5xl mr-4">👨‍⚕️</span>
                Painel do Médico
              </h1>
              <p className="text-xl text-green-100 mb-2">
                Bem-vindo, {usuario?.nome}!
              </p>
              <p className="text-green-200">
                Gerencie suas consultas e pacientes
              </p>
              {medico && (
                <div className="mt-3 inline-block bg-white bg-opacity-20 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">Especialidade: {medico.especialidade}</span>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-6xl">🩺</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Consultas */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Consultas</p>
              <p className="text-3xl font-bold text-gray-900">{totalConsultas}</p>
              <p className="text-xs text-gray-500 mt-1">Suas consultas</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Consultas Hoje */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Hoje</p>
              <p className="text-3xl font-bold text-gray-900">{consultasHoje}</p>
              <p className="text-xs text-gray-500 mt-1">Consultas de hoje</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Próximas Consultas */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Próximos 7 dias</p>
              <p className="text-3xl font-bold text-gray-900">{proximasConsultas.length}</p>
              <p className="text-xs text-gray-500 mt-1">Consultas agendadas</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Notificações</p>
              <p className="text-3xl font-bold text-gray-900">{notificacoes.length}</p>
              <p className="text-xs text-gray-500 mt-1">Mensagens pendentes</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg">
              <Bell className="h-8 w-8 text-white" />
            </div>
          </div>
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
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{consulta.paciente?.nome}</p>
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
            <p className="text-gray-500 text-center py-8">Nenhuma consulta agendada para os próximos 7 dias</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardMedico;
