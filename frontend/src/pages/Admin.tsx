import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { usuarioService } from '../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filtroUsuario, setFiltroUsuario] = useState({
    tipo: 'todos',
    busca: '',
    ativo: 'todos'
  });

  const { data: usuariosData, isLoading: loadingUsuarios } = useQuery({
    queryKey: ['usuarios-admin', filtroUsuario],
    queryFn: () => usuarioService.listar(),
  });

  const alterarStatusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      usuarioService.alterarStatus(id, ativo),
    onSuccess: () => {
      toast.success('Status do usuário atualizado com sucesso!');
      queryClient.invalidateQueries(['usuarios-admin']);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao atualizar status');
    }
  });

  const deletarMutation = useMutation({
    mutationFn: (id: number) => usuarioService.deletar(id),
    onSuccess: () => {
      toast.success('Usuário removido com sucesso!');
      queryClient.invalidateQueries(['usuarios-admin']);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover usuário');
    }
  });

  const usuarios = usuariosData?.data || [];

  const usuariosFiltrados = usuarios.filter((u: any) => {
    if (filtroUsuario.tipo !== 'todos' && u.tipo !== filtroUsuario.tipo) return false;
    if (filtroUsuario.ativo !== 'todos') {
      const ativo = filtroUsuario.ativo === 'ativo';
      if (u.ativo !== ativo) return false;
    }
    if (filtroUsuario.busca) {
      const busca = filtroUsuario.busca.toLowerCase();
      if (!u.nome?.toLowerCase().includes(busca) &&
          !u.email?.toLowerCase().includes(busca) &&
          !u.cpf?.toLowerCase().includes(busca)) return false;
    }
    return true;
  });

  const estatisticas = {
    total: usuarios.length,
    pacientes: usuarios.filter((u: any) => u.tipo === 'paciente').length,
    medicos: usuarios.filter((u: any) => u.tipo === 'medico').length,
    admins: usuarios.filter((u: any) => u.tipo === 'admin').length,
    ativos: usuarios.filter((u: any) => u.ativo).length,
    inativos: usuarios.filter((u: any) => !u.ativo).length
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
        <p className="text-gray-600">Gerencie usuários e configurações do sistema</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pacientes</p>
              <p className="text-2xl font-bold text-blue-600">{estatisticas.pacientes}</p>
            </div>
            <div className="text-3xl">👤</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Médicos</p>
              <p className="text-2xl font-bold text-purple-600">{estatisticas.medicos}</p>
            </div>
            <div className="text-3xl">🩺</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Usuários Ativos</p>
              <p className="text-2xl font-bold text-green-600">{estatisticas.ativos}</p>
              <p className="text-xs text-gray-500 mt-1">{estatisticas.inativos} inativos</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
      </div>

      {/* Links Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/estatisticas')}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Estatísticas</h3>
              <p className="text-sm text-gray-600">Visualize métricas e relatórios</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/configuracoes')}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">⚙️</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Configurações</h3>
              <p className="text-sm text-gray-600">Configure o sistema</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => navigate('/financeiro')}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">💰</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Financeiro</h3>
              <p className="text-sm text-gray-600">Gerencie pagamentos e faturas</p>
            </div>
          </div>
        </button>
      </div>

      {/* Gestão de Usuários */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Gestão de Usuários</h2>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={filtroUsuario.tipo}
              onChange={(e) => setFiltroUsuario({ ...filtroUsuario, tipo: e.target.value })}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm font-medium"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="paciente">Pacientes</option>
              <option value="medico">Médicos</option>
              <option value="admin">Administradores</option>
            </select>
            <select
              value={filtroUsuario.ativo}
              onChange={(e) => setFiltroUsuario({ ...filtroUsuario, ativo: e.target.value })}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm font-medium"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={filtroUsuario.busca}
              onChange={(e) => setFiltroUsuario({ ...filtroUsuario, busca: e.target.value })}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm flex-1 md:flex-none md:w-64"
            />
          </div>
        </div>

        {loadingUsuarios ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Carregando usuários...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 text-lg">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosFiltrados.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.tipo === 'admin' ? 'bg-orange-100 text-orange-800' :
                        u.tipo === 'medico' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja ${u.ativo ? 'desativar' : 'ativar'} este usuário?`)) {
                              alterarStatusMutation.mutate({ id: u.id, ativo: !u.ativo });
                            }
                          }}
                          className={`${
                            u.ativo ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                          } font-medium`}
                        >
                          {u.ativo ? '⏸️ Desativar' : '▶️ Ativar'}
                        </button>
                        {u.id !== usuario?.id && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja remover o usuário "${u.nome}"?`)) {
                                deletarMutation.mutate(u.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            🗑️ Remover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
