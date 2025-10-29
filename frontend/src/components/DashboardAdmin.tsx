import React from 'react';
import { useQuery } from 'react-query';
import { consultaService, medicoService, notificacaoService } from '../services/api';
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  Bell, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const DashboardAdmin: React.FC = () => {
  // Buscar estatísticas gerais do sistema
  const { data: consultasData } = useQuery(
    'admin-dashboard-consultas',
    () => consultaService.listar({ page: 1, limit: 10 }),
    { enabled: true }
  );

  const { data: medicosData } = useQuery(
    'admin-dashboard-medicos',
    () => medicoService.listar({ page: 1, limit: 10 }),
    { enabled: true }
  );

  const { data: notificacoesData } = useQuery(
    'admin-dashboard-notificacoes',
    () => notificacaoService.listar({ page: 1, limit: 5 }),
    { enabled: true }
  );

  const consultas = Array.isArray(consultasData?.data?.consultas) ? consultasData.data.consultas : 
                   Array.isArray(consultasData?.data) ? consultasData.data : [];
  const medicos = Array.isArray(medicosData?.data) ? medicosData.data : [];
  const notificacoes = Array.isArray(notificacoesData?.data) ? notificacoesData.data : [];

  // Calcular estatísticas
  const totalConsultas = consultas.length;
  const consultasHoje = consultas.filter((c: any) => 
    new Date(c.data).toDateString() === new Date().toDateString()
  ).length;
  const consultasAgendadas = consultas.filter((c: any) => c.status === 'agendada').length;
  const consultasConfirmadas = consultas.filter((c: any) => c.status === 'confirmada').length;
  const consultasCanceladas = consultas.filter((c: any) => c.status === 'cancelada').length;

  const totalMedicos = medicos.length;
  const medicosAtivos = medicos.filter((m: any) => m.ativo).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section com imagem de fundo */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-4 flex items-center">
                <span className="text-5xl mr-4">👨‍💼</span>
                Painel Administrativo
              </h1>
              <p className="text-xl text-blue-100 mb-2">
                Visão geral completa do sistema de agendamento médico
              </p>
              <p className="text-blue-200">
                Gerencie médicos, pacientes e consultas em tempo real
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-6xl">🏥</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Consultas */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Consultas</p>
              <p className="text-3xl font-bold text-gray-900">{totalConsultas}</p>
              <p className="text-xs text-gray-500 mt-1">Todas as consultas</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
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

        {/* Médicos Ativos */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Médicos Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{medicosAtivos}</p>
              <p className="text-xs text-gray-500 mt-1">De {totalMedicos} total</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Notificações</p>
              <p className="text-3xl font-bold text-gray-900">{notificacoes.length}</p>
              <p className="text-xs text-gray-500 mt-1">Mensagens pendentes</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg">
              <Bell className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Status das Consultas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Confirmadas</p>
              <p className="text-2xl font-bold text-green-600">{consultasConfirmadas}</p>
              <p className="text-xs text-gray-500 mt-1">Consultas confirmadas</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Agendadas</p>
              <p className="text-2xl font-bold text-yellow-600">{consultasAgendadas}</p>
              <p className="text-xs text-gray-500 mt-1">Aguardando confirmação</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Canceladas</p>
              <p className="text-2xl font-bold text-red-600">{consultasCanceladas}</p>
              <p className="text-xs text-gray-500 mt-1">Consultas canceladas</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Consultas Recentes */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 text-blue-600 mr-3" />
            Consultas Recentes
          </h3>
        </div>
        <div className="p-6">
          {consultas.length > 0 ? (
            <div className="space-y-4">
              {consultas.slice(0, 5).map((consulta: any, index: number) => (
                <div key={consulta.id} className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{consulta.paciente?.nome}</p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Stethoscope className="h-4 w-4 mr-1" />
                        {consulta.medico?.nome}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{consulta.data}</p>
                    <p className="text-sm text-gray-600">{consulta.horario}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      consulta.status === 'confirmada' ? 'bg-green-100 text-green-800' :
                      consulta.status === 'agendada' ? 'bg-yellow-100 text-yellow-800' :
                      consulta.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {consulta.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">Nenhuma consulta encontrada</p>
              <p className="text-gray-400 text-sm mt-1">As consultas aparecerão aqui quando forem criadas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
