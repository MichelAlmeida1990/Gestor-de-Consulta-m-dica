import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { pagamentoService, faturaService, consultaService } from '../services/api';
import { Pagamento, Fatura, Consulta } from '../types';
import { toast } from 'react-hot-toast';

const Financeiro: React.FC = () => {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [abaAtiva, setAbaAtiva] = useState<'pagamentos' | 'faturas'>('pagamentos');
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  const [mostrarModalFatura, setMostrarModalFatura] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<number | null>(null);
  const [formPagamento, setFormPagamento] = useState({
    consulta_id: '',
    valor: '',
    forma_pagamento: 'dinheiro',
    observacoes: ''
  });
  const [formFatura, setFormFatura] = useState({
    consulta_id: '',
    valor_desconto: '0',
    observacoes: ''
  });
  const [filtroPagamento, setFiltroPagamento] = useState({
    status: 'todos',
    busca: ''
  });
  const [filtroFatura, setFiltroFatura] = useState({
    status: 'todos',
    busca: ''
  });

  // Verificar se o usuário está autenticado
  if (!usuario) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Você precisa estar autenticado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Queries
  const { data: pagamentosData, isLoading: loadingPagamentos, error: errorPagamentos } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: async () => {
      try {
        const response = await pagamentoService.listar();
        return response;
      } catch (error: any) {
        console.error('Erro ao carregar pagamentos:', error);
        throw error;
      }
    },
    enabled: abaAtiva === 'pagamentos',
    retry: 1,
    onError: (error: any) => {
      console.error('Erro ao carregar pagamentos:', error);
      toast.error('Erro ao carregar pagamentos');
    }
  });

  const { data: faturasData, isLoading: loadingFaturas, error: errorFaturas } = useQuery({
    queryKey: ['faturas'],
    queryFn: () => faturaService.listar(),
    enabled: abaAtiva === 'faturas',
    retry: 1,
    onError: (error: any) => {
      console.error('Erro ao carregar faturas:', error);
      toast.error('Erro ao carregar faturas');
    }
  });

  const { data: consultasData, error: errorConsultas, isLoading: loadingConsultas } = useQuery({
    queryKey: ['consultas', mostrarModalPagamento || mostrarModalFatura],
    queryFn: async () => {
      try {
        const response = await consultaService.listar({ status: 'confirmada' });
        return response;
      } catch (error: any) {
        console.error('Erro ao carregar consultas:', error);
        throw error;
      }
    },
    enabled: mostrarModalPagamento || mostrarModalFatura,
    retry: 1,
    onError: (error: any) => {
      console.error('Erro ao carregar consultas:', error);
      toast.error('Erro ao carregar consultas disponíveis');
    }
  });

  // Mutations
  const criarPagamentoMutation = useMutation({
    mutationFn: (dados: any) => pagamentoService.criar(dados),
    onSuccess: () => {
      toast.success('Pagamento criado com sucesso!');
      queryClient.invalidateQueries(['pagamentos']);
      setMostrarModalPagamento(false);
      setFormPagamento({ consulta_id: '', valor: '', forma_pagamento: 'dinheiro', observacoes: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar pagamento');
    }
  });

  const confirmarPagamentoMutation = useMutation({
    mutationFn: (id: number) => pagamentoService.confirmar(id),
    onSuccess: () => {
      toast.success('Pagamento confirmado com sucesso!');
      queryClient.invalidateQueries(['pagamentos']);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao confirmar pagamento');
    }
  });

  const gerarFaturaMutation = useMutation({
    mutationFn: (dados: any) => faturaService.criar(dados),
    onSuccess: () => {
      toast.success('Fatura gerada com sucesso!');
      queryClient.invalidateQueries(['faturas']);
      setMostrarModalFatura(false);
      setFormFatura({ consulta_id: '', valor_desconto: '0', observacoes: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao gerar fatura');
    }
  });

  const pagamentos = pagamentosData?.data || [];
  const faturas = faturasData?.data || [];
  
  // Tratamento de erros
  if (errorPagamentos && abaAtiva === 'pagamentos') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-gray-600">Gerencie pagamentos e faturas</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erro ao carregar pagamentos. Tente novamente.</p>
        </div>
      </div>
    );
  }
  
  if (errorFaturas && abaAtiva === 'faturas') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-gray-600">Gerencie pagamentos e faturas</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erro ao carregar faturas. Tente novamente.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
      case 'paga':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      case 'vencida':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago':
        return 'Pago';
      case 'pendente':
        return 'Pendente';
      case 'cancelado':
        return 'Cancelado';
      case 'reembolsado':
        return 'Reembolsado';
      case 'paga':
        return 'Paga';
      case 'cancelada':
        return 'Cancelada';
      case 'vencida':
        return 'Vencida';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  };

  const handleConfirmarPagamento = (id: number) => {
    if (window.confirm('Tem certeza que deseja confirmar este pagamento?')) {
      confirmarPagamentoMutation.mutate(id);
    }
  };

  const handleCriarPagamento = () => {
    if (!formPagamento.consulta_id || !formPagamento.valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    criarPagamentoMutation.mutate({
      consulta_id: parseInt(formPagamento.consulta_id),
      valor: parseFloat(formPagamento.valor),
      forma_pagamento: formPagamento.forma_pagamento,
      observacoes: formPagamento.observacoes
    });
  };

  const handleGerarFatura = () => {
    if (!formFatura.consulta_id) {
      toast.error('Selecione uma consulta');
      return;
    }
    gerarFaturaMutation.mutate({
      consulta_id: parseInt(formFatura.consulta_id),
      valor_desconto: parseFloat(formFatura.valor_desconto) || 0,
      observacoes: formFatura.observacoes
    });
  };

  const consultas = Array.isArray(consultasData?.data) ? consultasData.data : [];

  // Calcular estatísticas de pagamentos
  const estatisticasPagamentos = React.useMemo(() => {
    const total = pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0);
    const pago = pagamentos
      .filter(p => p.status === 'pago')
      .reduce((sum, p) => sum + (p.valor || 0), 0);
    const pendente = pagamentos
      .filter(p => p.status === 'pendente')
      .reduce((sum, p) => sum + (p.valor || 0), 0);
    const totalPagamentos = pagamentos.length;
    const pagamentosPagos = pagamentos.filter(p => p.status === 'pago').length;
    const pagamentosPendentes = pagamentos.filter(p => p.status === 'pendente').length;

    return { total, pago, pendente, totalPagamentos, pagamentosPagos, pagamentosPendentes };
  }, [pagamentos]);

  // Calcular estatísticas de faturas
  const estatisticasFaturas = React.useMemo(() => {
    const total = faturas.reduce((sum, f) => sum + (f.valor_final || 0), 0);
    const paga = faturas
      .filter(f => f.status === 'paga')
      .reduce((sum, f) => sum + (f.valor_final || 0), 0);
    const pendente = faturas
      .filter(f => f.status === 'pendente')
      .reduce((sum, f) => sum + (f.valor_final || 0), 0);
    const vencida = faturas
      .filter(f => f.status === 'vencida')
      .reduce((sum, f) => sum + (f.valor_final || 0), 0);
    const totalFaturas = faturas.length;
    const faturasPagas = faturas.filter(f => f.status === 'paga').length;
    const faturasPendentes = faturas.filter(f => f.status === 'pendente').length;

    return { total, paga, pendente, vencida, totalFaturas, faturasPagas, faturasPendentes };
  }, [faturas]);

  // Filtrar pagamentos
  const pagamentosFiltrados = React.useMemo(() => {
    let filtrados = [...pagamentos];
    
    if (filtroPagamento.status !== 'todos') {
      filtrados = filtrados.filter(p => p.status === filtroPagamento.status);
    }
    
    if (filtroPagamento.busca) {
      const busca = filtroPagamento.busca.toLowerCase();
      filtrados = filtrados.filter(p => 
        p.consulta_id?.toString().includes(busca) ||
        (p as any).paciente_nome?.toLowerCase().includes(busca) ||
        (p as any).medico_nome?.toLowerCase().includes(busca) ||
        p.forma_pagamento?.toLowerCase().includes(busca)
      );
    }
    
    return filtrados;
  }, [pagamentos, filtroPagamento]);

  // Filtrar faturas
  const faturasFiltradas = React.useMemo(() => {
    let filtradas = [...faturas];
    
    if (filtroFatura.status !== 'todos') {
      filtradas = filtradas.filter(f => f.status === filtroFatura.status);
    }
    
    if (filtroFatura.busca) {
      const busca = filtroFatura.busca.toLowerCase();
      filtradas = filtradas.filter(f => 
        f.consulta_id?.toString().includes(busca) ||
        f.numero_fatura?.toLowerCase().includes(busca) ||
        (f as any).paciente_nome?.toLowerCase().includes(busca) ||
        (f as any).medico_nome?.toLowerCase().includes(busca)
      );
    }
    
    return filtradas;
  }, [faturas, filtroFatura]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão Financeira</h1>
        <p className="text-gray-600">Gerencie pagamentos e faturas do sistema</p>
      </div>

      {/* Cards de Resumo Financeiro */}
      {abaAtiva === 'pagamentos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticasPagamentos.totalPagamentos}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(estatisticasPagamentos.pago)}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(estatisticasPagamentos.pendente)}</p>
                <p className="text-xs text-gray-500 mt-1">{estatisticasPagamentos.pagamentosPendentes} pagamentos</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(estatisticasPagamentos.total)}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'faturas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Faturas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticasFaturas.totalFaturas}</p>
              </div>
              <div className="text-3xl">📄</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(estatisticasFaturas.paga)}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(estatisticasFaturas.pendente)}</p>
                <p className="text-xs text-gray-500 mt-1">{estatisticasFaturas.faturasPendentes} faturas</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(estatisticasFaturas.vencida)}</p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-1">
        <nav className="flex space-x-2">
          <button
            onClick={() => setAbaAtiva('pagamentos')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
              abaAtiva === 'pagamentos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💰 Pagamentos
          </button>
          <button
            onClick={() => setAbaAtiva('faturas')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
              abaAtiva === 'faturas'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📄 Faturas
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {abaAtiva === 'pagamentos' && (
        <div>
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Lista de Pagamentos</h2>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Filtro de Status */}
              <select
                value={filtroPagamento.status}
                onChange={(e) => setFiltroPagamento({ ...filtroPagamento, status: e.target.value })}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm font-medium"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
              
              {/* Busca */}
              <input
                type="text"
                placeholder="Buscar pagamentos..."
                value={filtroPagamento.busca}
                onChange={(e) => setFiltroPagamento({ ...filtroPagamento, busca: e.target.value })}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm flex-1 md:flex-none md:w-64"
              />
              
              {usuario?.tipo === 'admin' && (
                <button
                  onClick={() => setMostrarModalPagamento(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2 whitespace-nowrap"
                >
                  <span>+</span> Novo Pagamento
                </button>
              )}
            </div>
          </div>

          {loadingPagamentos ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Carregando pagamentos...</p>
            </div>
          ) : pagamentos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-gray-500 text-lg">Nenhum pagamento encontrado</p>
              <p className="text-gray-400 text-sm mt-2">Os pagamentos aparecerão aqui quando forem criados</p>
            </div>
          ) : pagamentosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">Nenhum pagamento encontrado com os filtros aplicados</p>
              <button
                onClick={() => setFiltroPagamento({ status: 'todos', busca: '' })}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Mostrando {pagamentosFiltrados.length} de {pagamentos.length} pagamentos
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagamentosFiltrados.map((pagamento: Pagamento) => {
                if (!pagamento || !pagamento.id) return null;
                return (
                  <div key={pagamento.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Consulta #{pagamento.consulta_id || '-'}
                        </h3>
                        {(pagamento as any).paciente_nome && (
                          <p className="text-sm text-gray-600 mb-1">
                            👤 {(pagamento as any).paciente_nome}
                          </p>
                        )}
                        {(pagamento as any).medico_nome && (
                          <p className="text-sm text-gray-600">
                            🩺 {(pagamento as any).medico_nome}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(pagamento.status || 'pendente')}`}>
                        {getStatusLabel(pagamento.status || 'pendente')}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Valor:</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(pagamento.valor)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Forma de pagamento:</span>
                        <span className="text-sm font-medium text-gray-800">{pagamento.forma_pagamento || '-'}</span>
                      </div>
                      {(pagamento as any).data && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Data da consulta:</span>
                          <span className="text-sm text-gray-800">{formatDate((pagamento as any).data)}</span>
                        </div>
                      )}
                      {pagamento.data_vencimento && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Vencimento:</span>
                          <span className="text-sm text-gray-800">{formatDate(pagamento.data_vencimento)}</span>
                        </div>
                      )}
                      {pagamento.data_pagamento && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pago em:</span>
                          <span className="text-sm font-medium text-green-600">{formatDate(pagamento.data_pagamento)}</span>
                        </div>
                      )}
                    </div>

                    {pagamento.observacoes && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 italic">
                          📝 {pagamento.observacoes}
                        </p>
                      </div>
                    )}

                    {usuario?.tipo === 'admin' && pagamento.status === 'pendente' && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleConfirmarPagamento(pagamento.id)}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm hover:shadow-md transition-all font-medium"
                        >
                          ✓ Confirmar Pagamento
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </>
          )}
        </div>
      )}

      {abaAtiva === 'faturas' && (
        <div>
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Lista de Faturas</h2>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Filtro de Status */}
              <select
                value={filtroFatura.status}
                onChange={(e) => setFiltroFatura({ ...filtroFatura, status: e.target.value })}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm font-medium"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="paga">Paga</option>
                <option value="vencida">Vencida</option>
                <option value="cancelada">Cancelada</option>
              </select>
              
              {/* Busca */}
              <input
                type="text"
                placeholder="Buscar faturas..."
                value={filtroFatura.busca}
                onChange={(e) => setFiltroFatura({ ...filtroFatura, busca: e.target.value })}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm flex-1 md:flex-none md:w-64"
              />
              
              {usuario?.tipo === 'admin' && (
                <button
                  onClick={() => setMostrarModalFatura(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2 whitespace-nowrap"
                >
                  <span>+</span> Gerar Fatura
                </button>
              )}
            </div>
          </div>

          {loadingFaturas ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Carregando faturas...</p>
            </div>
          ) : faturas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-500 text-lg">Nenhuma fatura encontrada</p>
              <p className="text-gray-400 text-sm mt-2">As faturas aparecerão aqui quando forem geradas</p>
            </div>
          ) : faturasFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">Nenhuma fatura encontrada com os filtros aplicados</p>
              <button
                onClick={() => setFiltroFatura({ status: 'todos', busca: '' })}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Mostrando {faturasFiltradas.length} de {faturas.length} faturas
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {faturasFiltradas.map((fatura: Fatura) => (
                <div key={fatura.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Fatura #{fatura.numero_fatura || `#${fatura.id}`}
                      </h3>
                      {(fatura as any).paciente_nome && (
                        <p className="text-sm text-gray-600 mb-1">
                          👤 {(fatura as any).paciente_nome}
                        </p>
                      )}
                      {(fatura as any).medico_nome && (
                        <p className="text-sm text-gray-600">
                          🩺 {(fatura as any).medico_nome}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(fatura.status)}`}>
                      {getStatusLabel(fatura.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Consulta:</span>
                      <span className="text-sm font-medium text-gray-800">#{fatura.consulta_id}</span>
                    </div>
                    {(fatura as any).data && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Data da consulta:</span>
                        <span className="text-sm text-gray-800">{formatDate((fatura as any).data)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Valor total:</span>
                        <span className="text-sm font-medium text-gray-800">{formatCurrency(fatura.valor_total)}</span>
                      </div>
                      {fatura.valor_desconto > 0 && (
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Desconto:</span>
                          <span className="text-sm font-medium text-green-600">-{formatCurrency(fatura.valor_desconto)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-base font-semibold text-gray-900">Valor final:</span>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(fatura.valor_final)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Emissão:</span>
                      <span className="text-sm text-gray-800">{formatDate(fatura.data_emissao)}</span>
                    </div>
                    {fatura.data_vencimento && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Vencimento:</span>
                        <span className="text-sm font-medium text-orange-600">{formatDate(fatura.data_vencimento)}</span>
                      </div>
                    )}
                  </div>

                  {fatura.observacoes && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 italic">
                        📝 {fatura.observacoes}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {/* Implementar visualização/impressão da fatura */}}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all font-medium"
                    >
                      👁️ Ver Fatura
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal Criar Pagamento */}
      {mostrarModalPagamento && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMostrarModalPagamento(false);
              setFormPagamento({ consulta_id: '', valor: '', forma_pagamento: 'dinheiro', observacoes: '' });
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Criar Novo Pagamento</h3>
            {errorConsultas ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">Erro ao carregar consultas. Tente novamente.</p>
              </div>
            ) : null}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Consulta *
                </label>
                {loadingConsultas ? (
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Carregando consultas...</p>
                  </div>
                ) : (
                  <select
                    value={formPagamento.consulta_id}
                    onChange={(e) => setFormPagamento({ ...formPagamento, consulta_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    disabled={loadingConsultas}
                  >
                    <option value="">Selecione uma consulta</option>
                    {consultas.length === 0 ? (
                      <option value="" disabled>Nenhuma consulta confirmada disponível</option>
                    ) : (
                      consultas.map((consulta: Consulta) => {
                        if (!consulta || !consulta.id) return null;
                        return (
                          <option key={consulta.id} value={consulta.id}>
                            Consulta #{consulta.id} - {formatDate(consulta.data)} - {formatCurrency(consulta.preco || consulta.valor || 0)}
                          </option>
                        );
                      })
                    )}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formPagamento.valor}
                  onChange={(e) => setFormPagamento({ ...formPagamento, valor: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Forma de Pagamento *
                </label>
                <select
                  value={formPagamento.forma_pagamento}
                  onChange={(e) => setFormPagamento({ ...formPagamento, forma_pagamento: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="cartao_debito">💳 Cartão de Débito</option>
                  <option value="cartao_credito">💳 Cartão de Crédito</option>
                  <option value="pix">📱 PIX</option>
                  <option value="transferencia">🏦 Transferência Bancária</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formPagamento.observacoes}
                  onChange={(e) => setFormPagamento({ ...formPagamento, observacoes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  rows={3}
                  placeholder="Observações adicionais (opcional)"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setMostrarModalPagamento(false);
                  setFormPagamento({ consulta_id: '', valor: '', forma_pagamento: 'dinheiro', observacoes: '' });
                }}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarPagamento}
                disabled={criarPagamentoMutation.isLoading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all font-medium"
              >
                {criarPagamentoMutation.isLoading ? 'Criando...' : '✓ Criar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gerar Fatura */}
      {mostrarModalFatura && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMostrarModalFatura(false);
              setFormFatura({ consulta_id: '', valor_desconto: '0', observacoes: '' });
              setConsultaSelecionada(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Gerar Nova Fatura</h3>
            {errorConsultas ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">Erro ao carregar consultas. Tente novamente.</p>
              </div>
            ) : null}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Consulta *
                </label>
                {loadingConsultas ? (
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Carregando consultas...</p>
                  </div>
                ) : (
                  <select
                    value={formFatura.consulta_id}
                    onChange={(e) => {
                      const consulta = consultas.find((c: Consulta) => c && c.id === parseInt(e.target.value));
                      setFormFatura({ ...formFatura, consulta_id: e.target.value });
                      setConsultaSelecionada(consulta ? consulta.id : null);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    disabled={loadingConsultas}
                  >
                    <option value="">Selecione uma consulta</option>
                    {consultas.length === 0 ? (
                      <option value="" disabled>Nenhuma consulta confirmada disponível</option>
                    ) : (
                      consultas.map((consulta: Consulta) => {
                        if (!consulta || !consulta.id) return null;
                        return (
                          <option key={consulta.id} value={consulta.id}>
                            Consulta #{consulta.id} - {formatDate(consulta.data)} - {formatCurrency(consulta.preco || consulta.valor || 0)}
                          </option>
                        );
                      })
                    )}
                  </select>
                )}
                {consultaSelecionada && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      💰 Valor da consulta: <span className="font-bold">{formatCurrency(consultas.find((c: Consulta) => c && c.id === consultaSelecionada)?.preco || consultas.find((c: Consulta) => c && c.id === consultaSelecionada)?.valor || 0)}</span>
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valor de Desconto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formFatura.valor_desconto}
                  onChange={(e) => setFormFatura({ ...formFatura, valor_desconto: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formFatura.observacoes}
                  onChange={(e) => setFormFatura({ ...formFatura, observacoes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  rows={3}
                  placeholder="Observações adicionais (opcional)"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setMostrarModalFatura(false);
                  setFormFatura({ consulta_id: '', valor_desconto: '0', observacoes: '' });
                  setConsultaSelecionada(null);
                }}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleGerarFatura}
                disabled={gerarFaturaMutation.isLoading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all font-medium"
              >
                {gerarFaturaMutation.isLoading ? 'Gerando...' : '✓ Gerar Fatura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financeiro;
