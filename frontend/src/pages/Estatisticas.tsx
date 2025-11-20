import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { consultaService, pagamentoService, faturaService, usuarioService, medicoService } from '../services/api';
// import { toast } from 'react-hot-toast';

const Estatisticas: React.FC = () => {
  const { usuario } = useAuth();
  const [periodo, setPeriodo] = useState<number>(30);

  // Queries para estatísticas
  const { data: estatisticasConsultas } = useQuery({
    queryKey: ['estatisticas-consultas', periodo],
    queryFn: () => consultaService.getEstatisticas(periodo),
  });

  const { data: pagamentosData } = useQuery({
    queryKey: ['pagamentos-estatisticas'],
    queryFn: () => pagamentoService.listar(),
  });

  const { data: faturasData } = useQuery({
    queryKey: ['faturas-estatisticas'],
    queryFn: () => faturaService.listar(),
  });

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-estatisticas'],
    queryFn: () => usuarioService.listar(),
  });

  const { data: medicosData } = useQuery({
    queryKey: ['medicos-estatisticas'],
    queryFn: () => medicoService.listar(),
  });

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calcularEstatisticas = () => {
    const pagamentos = pagamentosData?.data || [];
    const faturas = faturasData?.data || [];
    const usuarios = usuariosData?.data || [];
    const medicos = medicosData?.data || [];
    const consultas = estatisticasConsultas?.data || {};

    // Estatísticas de pagamentos
    const totalPagamentos = pagamentos.length;
    const pagamentosPagos = pagamentos.filter((p: any) => p.status === 'pago').length;
    const valorTotalPagamentos = pagamentos.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
    const valorPago = pagamentos
      .filter((p: any) => p.status === 'pago')
      .reduce((sum: number, p: any) => sum + (p.valor || 0), 0);

    // Estatísticas de faturas
    const totalFaturas = faturas.length;
    const faturasPagas = faturas.filter((f: any) => f.status === 'paga').length;
    const valorTotalFaturas = faturas.reduce((sum: number, f: any) => sum + (f.valor_final || 0), 0);
    const valorFaturasPago = faturas
      .filter((f: any) => f.status === 'paga')
      .reduce((sum: number, f: any) => sum + (f.valor_final || 0), 0);

    // Estatísticas de usuários
    const totalUsuarios = usuarios.length;
    const pacientes = usuarios.filter((u: any) => u.tipo === 'paciente').length;
    const medicosCount = usuarios.filter((u: any) => u.tipo === 'medico').length;
    const admins = usuarios.filter((u: any) => u.tipo === 'admin').length;

    // Estatísticas de médicos
    const medicosAtivos = medicos.filter((m: any) => m.ativo).length;

    return {
      pagamentos: {
        total: totalPagamentos,
        pagos: pagamentosPagos,
        pendentes: totalPagamentos - pagamentosPagos,
        valorTotal: valorTotalPagamentos,
        valorPago,
        taxaPagamento: totalPagamentos > 0 ? ((pagamentosPagos / totalPagamentos) * 100).toFixed(1) : '0'
      },
      faturas: {
        total: totalFaturas,
        pagas: faturasPagas,
        pendentes: totalFaturas - faturasPagas,
        valorTotal: valorTotalFaturas,
        valorPago: valorFaturasPago,
        taxaPagamento: totalFaturas > 0 ? ((faturasPagas / totalFaturas) * 100).toFixed(1) : '0'
      },
      usuarios: {
        total: totalUsuarios,
        pacientes,
        medicos: medicosCount,
        admins
      },
      medicos: {
        total: medicos.length,
        ativos: medicosAtivos,
        inativos: medicos.length - medicosAtivos
      },
      consultas: {
        total: consultas.total_consultas || 0,
        realizadas: consultas.consultas_realizadas || 0,
        canceladas: consultas.consultas_canceladas || 0,
        agendadas: consultas.consultas_agendadas || 0,
        taxaComparecimento: consultas.taxa_comparecimento || 0,
        faturamentoTotal: consultas.faturamento_total || 0
      }
    };
  };

  const stats = calcularEstatisticas();

  if (usuario?.tipo !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">Acesso negado. Apenas administradores podem visualizar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Estatísticas do Sistema</h1>
        <p className="text-gray-600">Visão geral e métricas do sistema</p>
      </div>

      {/* Filtro de Período */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700">Período:</label>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(Number(e.target.value))}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={365}>Último ano</option>
          </select>
        </div>
      </div>

      {/* Cards de Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Consultas</p>
              <p className="text-3xl font-bold text-gray-900">{stats.consultas.total}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Faturamento Total</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.consultas.faturamentoTotal)}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Usuários</p>
              <p className="text-3xl font-bold text-blue-600">{stats.usuarios.total}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Médicos Ativos</p>
              <p className="text-3xl font-bold text-purple-600">{stats.medicos.ativos}</p>
            </div>
            <div className="text-4xl">🩺</div>
          </div>
        </div>
      </div>

      {/* Estatísticas de Consultas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Consultas</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Realizadas</span>
              <span className="text-lg font-bold text-green-600">{stats.consultas.realizadas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Agendadas</span>
              <span className="text-lg font-bold text-yellow-600">{stats.consultas.agendadas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Canceladas</span>
              <span className="text-lg font-bold text-red-600">{stats.consultas.canceladas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Taxa de Comparecimento</span>
              <span className="text-lg font-bold text-blue-600">{stats.consultas.taxaComparecimento.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Estatísticas Financeiras */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💵 Financeiro</h2>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Pagamentos Recebidos</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(stats.pagamentos.valorPago)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {stats.pagamentos.pagos} de {stats.pagamentos.total} pagamentos ({stats.pagamentos.taxaPagamento}%)
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Faturas Pagas</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(stats.faturas.valorPago)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {stats.faturas.pagas} de {stats.faturas.total} faturas ({stats.faturas.taxaPagamento}%)
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Pendente</span>
                <span className="text-lg font-bold text-yellow-600">
                  {formatCurrency(stats.pagamentos.valorTotal - stats.pagamentos.valorPago + stats.faturas.valorTotal - stats.faturas.valorPago)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas de Usuários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Usuários</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total de Usuários</span>
              <span className="text-lg font-bold text-blue-600">{stats.usuarios.total}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Pacientes</span>
              <span className="text-lg font-bold text-green-600">{stats.usuarios.pacientes}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Médicos</span>
              <span className="text-lg font-bold text-purple-600">{stats.usuarios.medicos}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Administradores</span>
              <span className="text-lg font-bold text-orange-600">{stats.usuarios.admins}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🩺 Médicos</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Médicos Ativos</span>
              <span className="text-lg font-bold text-green-600">{stats.medicos.ativos}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Médicos Inativos</span>
              <span className="text-lg font-bold text-red-600">{stats.medicos.inativos}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total de Médicos</span>
              <span className="text-lg font-bold text-blue-600">{stats.medicos.total}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Taxa de Ativação</div>
              <div className="text-lg font-bold text-gray-900">
                {stats.medicos.total > 0 ? ((stats.medicos.ativos / stats.medicos.total) * 100).toFixed(1) : '0'}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estatisticas;

