import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { pagamentoService, faturaService } from '../services/api';
import { Pagamento, Fatura } from '../types';
import { toast } from 'react-hot-toast';

const Financeiro: React.FC = () => {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [abaAtiva, setAbaAtiva] = useState<'pagamentos' | 'faturas'>('pagamentos');

  // Queries
  const { data: pagamentosData, isLoading: loadingPagamentos } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: () => pagamentoService.listar(),
    enabled: abaAtiva === 'pagamentos'
  });

  const { data: faturasData, isLoading: loadingFaturas } = useQuery({
    queryKey: ['faturas'],
    queryFn: () => faturaService.listar(),
    enabled: abaAtiva === 'faturas'
  });

  // Mutations
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
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao gerar fatura');
    }
  });

  const pagamentos = pagamentosData?.data || [];
  const faturas = faturasData?.data || [];

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleConfirmarPagamento = (id: number) => {
    if (window.confirm('Tem certeza que deseja confirmar este pagamento?')) {
      confirmarPagamentoMutation.mutate(id);
    }
  };

  const handleGerarFatura = (consultaId: number) => {
    const valorDesconto = prompt('Valor de desconto (opcional):') || '0';
    const observacoes = prompt('Observações (opcional):') || '';
    
    gerarFaturaMutation.mutate({
      consulta_id: consultaId,
      valor_desconto: parseFloat(valorDesconto) || 0,
      observacoes
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
        <p className="text-gray-600">Gerencie pagamentos e faturas</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setAbaAtiva('pagamentos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'pagamentos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pagamentos
            </button>
            <button
              onClick={() => setAbaAtiva('faturas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'faturas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Faturas
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      {abaAtiva === 'pagamentos' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Pagamentos</h2>
            {usuario?.tipo === 'admin' && (
              <button
                onClick={() => {/* Implementar criação de pagamento */}}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Novo Pagamento
              </button>
            )}
          </div>

          {loadingPagamentos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando pagamentos...</p>
            </div>
          ) : pagamentos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {pagamentos.map((pagamento: Pagamento) => (
                  <li key={pagamento.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Consulta #{pagamento.consulta_id}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pagamento.status)}`}>
                            {getStatusLabel(pagamento.status)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            Valor: <span className="font-medium">{formatCurrency(pagamento.valor)}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Forma de pagamento: {pagamento.forma_pagamento}
                          </p>
                          {pagamento.data_vencimento && (
                            <p className="text-sm text-gray-600">
                              Vencimento: {formatDate(pagamento.data_vencimento)}
                            </p>
                          )}
                          {pagamento.data_pagamento && (
                            <p className="text-sm text-gray-600">
                              Pago em: {formatDate(pagamento.data_pagamento)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {usuario?.tipo === 'admin' && pagamento.status === 'pendente' && (
                          <button
                            onClick={() => handleConfirmarPagamento(pagamento.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Confirmar
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {abaAtiva === 'faturas' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Faturas</h2>
            {usuario?.tipo === 'admin' && (
              <button
                onClick={() => {/* Implementar geração de fatura */}}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Gerar Fatura
              </button>
            )}
          </div>

          {loadingFaturas ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando faturas...</p>
            </div>
          ) : faturas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {faturas.map((fatura: Fatura) => (
                  <li key={fatura.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Fatura #{fatura.numero_fatura}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fatura.status)}`}>
                            {getStatusLabel(fatura.status)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            Consulta: #{fatura.consulta_id}
                          </p>
                          <p className="text-sm text-gray-600">
                            Valor total: <span className="font-medium">{formatCurrency(fatura.valor_total)}</span>
                          </p>
                          {fatura.valor_desconto > 0 && (
                            <p className="text-sm text-gray-600">
                              Desconto: <span className="font-medium text-green-600">-{formatCurrency(fatura.valor_desconto)}</span>
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            Valor final: <span className="font-medium text-blue-600">{formatCurrency(fatura.valor_final)}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Emissão: {formatDate(fatura.data_emissao)}
                          </p>
                          {fatura.data_vencimento && (
                            <p className="text-sm text-gray-600">
                              Vencimento: {formatDate(fatura.data_vencimento)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={() => {/* Implementar visualização/impressão da fatura */}}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Ver Fatura
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Financeiro;
