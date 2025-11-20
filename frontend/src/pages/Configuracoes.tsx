import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { configuracaoService } from '../services/api';
import { toast } from 'react-hot-toast';

const Configuracoes: React.FC = () => {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editDescricao, setEditDescricao] = useState<string>('');
  const [newConfig, setNewConfig] = useState({
    chave: '',
    valor: '',
    descricao: ''
  });
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: configuracoesData, isLoading, error: errorConfiguracoes } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      try {
        const response = await configuracaoService.listar();
        return response;
      } catch (error: any) {
        console.error('Erro ao carregar configurações:', error);
        throw error;
      }
    },
    retry: 1,
    onError: (error: any) => {
      console.error('Erro na query de configurações:', error);
      if (error.response?.status === 404) {
        toast.error('Endpoint de configurações não encontrado. Verifique se o backend está rodando.');
      } else if (error.response?.status === 403) {
        toast.error('Você não tem permissão para acessar as configurações');
      } else {
        toast.error('Erro ao carregar configurações');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ chave, valor, descricao }: { chave: string; valor: string; descricao?: string }) =>
      configuracaoService.atualizar(chave, { valor, descricao }),
    onSuccess: () => {
      toast.success('Configuração atualizada com sucesso!');
      queryClient.invalidateQueries(['configuracoes']);
      setEditingKey(null);
      setEditValue('');
      setEditDescricao('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao atualizar configuração');
    }
  });

  const createMutation = useMutation({
    mutationFn: (dados: any) => configuracaoService.criar(dados),
    onSuccess: () => {
      toast.success('Configuração criada com sucesso!');
      queryClient.invalidateQueries(['configuracoes']);
      setShowNewForm(false);
      setNewConfig({ chave: '', valor: '', descricao: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar configuração');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (chave: string) => configuracaoService.deletar(chave),
    onSuccess: () => {
      toast.success('Configuração removida com sucesso!');
      queryClient.invalidateQueries(['configuracoes']);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover configuração');
    }
  });

  const configuracoes = configuracoesData?.data || [];

  const handleEdit = (config: any) => {
    setEditingKey(config.chave);
    setEditValue(config.valor || '');
    setEditDescricao(config.descricao || '');
  };

  const handleSave = (chave: string) => {
    updateMutation.mutate({ chave, valor: editValue, descricao: editDescricao });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
    setEditDescricao('');
  };

  const handleCreate = () => {
    if (!newConfig.chave || !newConfig.valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createMutation.mutate(newConfig);
  };

  if (usuario?.tipo !== 'admin') {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">Acesso negado. Apenas administradores podem visualizar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações do Sistema</h1>
          <p className="text-gray-600">Gerencie as configurações gerais do sistema</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2"
        >
          <span>+</span> Nova Configuração
        </button>
      </div>

      {/* Formulário de Nova Configuração */}
      {showNewForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Criar Nova Configuração</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chave *
              </label>
              <input
                type="text"
                value={newConfig.chave}
                onChange={(e) => setNewConfig({ ...newConfig, chave: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="ex: nome_clinica"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valor *
              </label>
              <input
                type="text"
                value={newConfig.valor}
                onChange={(e) => setNewConfig({ ...newConfig, valor: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Valor da configuração"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descrição
              </label>
              <input
                type="text"
                value={newConfig.descricao}
                onChange={(e) => setNewConfig({ ...newConfig, descricao: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Descrição da configuração"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setShowNewForm(false);
                setNewConfig({ chave: '', valor: '', descricao: '' });
              }}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all font-medium"
            >
              {createMutation.isLoading ? 'Criando...' : '✓ Criar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de Configurações */}
      {errorConfiguracoes ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-800 font-medium mb-2">Erro ao carregar configurações</p>
            <p className="text-red-600 text-sm">
              {(errorConfiguracoes as any)?.response?.status === 404 
                ? 'Endpoint não encontrado. Verifique se o backend está rodando e reinicie-o.'
                : (errorConfiguracoes as any)?.response?.data?.error?.message || 'Erro desconhecido'}
            </p>
            <button
              onClick={() => queryClient.invalidateQueries(['configuracoes'])}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregando configurações...</p>
        </div>
      ) : configuracoes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <p className="text-gray-500 text-lg">Nenhuma configuração encontrada</p>
          <p className="text-gray-400 text-sm mt-2">Crie uma nova configuração para começar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Chave</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configuracoes.map((config: any) => (
                  <tr key={config.chave} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{config.chave}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingKey === config.chave ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-200"
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm text-gray-600 break-words max-w-xs">{config.valor || '-'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingKey === config.chave ? (
                        <input
                          type="text"
                          value={editDescricao}
                          onChange={(e) => setEditDescricao(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-200"
                          placeholder="Descrição (opcional)"
                        />
                      ) : (
                        <div className="text-sm text-gray-500 break-words max-w-xs">{config.descricao || '-'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingKey === config.chave ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(config.chave)}
                            disabled={updateMutation.isLoading}
                            className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
                          >
                            ✓ Salvar
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900 font-medium"
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja remover a configuração "${config.chave}"?`)) {
                                deleteMutation.mutate(config.chave);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            🗑️ Remover
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracoes;

