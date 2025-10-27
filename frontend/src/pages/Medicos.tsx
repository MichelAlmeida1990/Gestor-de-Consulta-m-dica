import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Stethoscope, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Shield,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { medicoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Medico {
  id: number;
  nome: string;
  especialidade: string;
  crm: string;
  telefone: string;
  email: string;
  ativo: boolean;
  created_at?: string;
}

interface MedicoForm {
  nome: string;
  especialidade: string;
  crm: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

const Medicos: React.FC = () => {
  const { usuario } = useAuth();
  const [filtros, setFiltros] = useState({
    especialidade: '',
    ativo: '',
    busca: ''
  });
  const [medicoSelecionado, setMedicoSelecionado] = useState<Medico | null>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<MedicoForm>();

  // Buscar médicos
  const { data: medicosData, isLoading, refetch } = useQuery(
    'medicos',
    () => medicoService.listar(filtros),
    { 
      enabled: !!usuario,
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: true
    }
  );

  const medicos = medicosData?.data || [];
  
  // Debug: log dos dados
  console.log('🔍 Usuario:', usuario);
  console.log('🔍 Medicos data:', medicosData);
  console.log('🔍 Medicos array:', medicos);
  console.log('🔍 Array length:', medicos.length);
  console.log('🔍 Is loading:', isLoading);
  console.log('🔍 Filtros:', filtros);
  console.log('🔍 Estrutura completa:', JSON.stringify(medicosData, null, 2));

  // Mutação para criar médico
  const criarMedicoMutation = useMutation(
    (data: MedicoForm) => medicoService.criar(data),
    {
      onSuccess: () => {
        toast.success('Médico cadastrado com sucesso!');
        queryClient.invalidateQueries('medicos');
        setTimeout(() => {
          refetch();
        }, 100);
        setMostrarFormulario(false);
        reset();
      },
      onError: (error: any) => {
        const message = error.response?.data?.error?.message || 'Erro ao cadastrar médico';
        if (error.response?.status === 409) {
          toast.error(`Conflito: ${message}`);
        } else {
          toast.error(message);
        }
      }
    }
  );

  // Mutação para atualizar médico
  const atualizarMedicoMutation = useMutation(
    ({ id, data }: { id: number; data: MedicoForm }) => medicoService.atualizar(id, data),
    {
      onSuccess: () => {
        toast.success('Médico atualizado com sucesso!');
        queryClient.invalidateQueries('medicos');
        setMostrarFormulario(false);
        setModoEdicao(false);
        reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao atualizar médico');
      }
    }
  );

  // Mutação para deletar médico
  const deletarMedicoMutation = useMutation(
    (id: number) => medicoService.deletar(id),
    {
      onSuccess: () => {
        toast.success('Médico removido com sucesso!');
        queryClient.invalidateQueries('medicos');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao remover médico');
      }
    }
  );

  // Mutação para alterar status
  const alterarStatusMutation = useMutation(
    ({ id, ativo }: { id: number; ativo: boolean }) => medicoService.alterarStatus(id, ativo),
    {
      onSuccess: () => {
        toast.success('Status do médico alterado com sucesso!');
        queryClient.invalidateQueries('medicos');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao alterar status');
      }
    }
  );

  const onSubmit = (data: MedicoForm) => {
    if (modoEdicao && medicoSelecionado) {
      atualizarMedicoMutation.mutate({ id: medicoSelecionado.id, data });
    } else {
      criarMedicoMutation.mutate(data);
    }
  };

  const handleVerDetalhes = (medico: Medico) => {
    setMedicoSelecionado(medico);
    setMostrarDetalhes(true);
  };

  const handleEditar = (medico: Medico) => {
    setMedicoSelecionado(medico);
    setModoEdicao(true);
    setMostrarFormulario(true);
    
    // Preencher formulário
    setValue('nome', medico.nome);
    setValue('especialidade', medico.especialidade);
    setValue('crm', medico.crm);
    setValue('telefone', medico.telefone);
    setValue('email', medico.email);
    setValue('ativo', medico.ativo);
  };

  const handleDeletar = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este médico? Esta ação não pode ser desfeita.')) {
      deletarMedicoMutation.mutate(id);
    }
  };

  const handleAlterarStatus = (id: number, ativo: boolean) => {
    const acao = ativo ? 'ativar' : 'desativar';
    if (window.confirm(`Tem certeza que deseja ${acao} este médico?`)) {
      alterarStatusMutation.mutate({ id, ativo });
    }
  };

  const handleNovoMedico = () => {
    setModoEdicao(false);
    setMedicoSelecionado(null);
    setMostrarFormulario(true);
    reset();
  };

  const handleFecharFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicao(false);
    setMedicoSelecionado(null);
    reset();
  };

  const especialidades = [
    'Cardiologia', 'Dermatologia', 'Neurologia', 'Ortopedia', 'Pediatria',
    'Ginecologia', 'Urologia', 'Oftalmologia', 'Psiquiatria', 'Endocrinologia',
    'Gastroenterologia', 'Pneumologia', 'Reumatologia', 'Oncologia', 'Cirurgia Geral'
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-azure-vivido rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Médicos</h1>
              <p className="text-gray-600">Gerencie o cadastro de médicos da clínica</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              {medicos.length} médico{medicos.length !== 1 ? 's' : ''}
            </span>
            {usuario?.tipo === 'admin' && (
              <button
                onClick={handleNovoMedico}
                className="bg-verde-botao text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Médico</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Buscar
            </label>
            <input
              type="text"
              value={filtros.busca}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              placeholder="Nome ou CRM..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
            />
          </div>

          {/* Especialidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especialidade
            </label>
            <select
              value={filtros.especialidade}
              onChange={(e) => setFiltros({ ...filtros, especialidade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
            >
              <option value="">Todas as especialidades</option>
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filtros.ativo}
              onChange={(e) => setFiltros({ ...filtros, ativo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => setFiltros({ especialidade: '', ativo: '', busca: '' })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Limpar Filtros
          </button>
          <button
            onClick={() => {
              console.log('🔄 Forçando reload...');
              refetch();
            }}
            className="px-4 py-2 text-sm text-white bg-azure-vivido hover:opacity-90 rounded-lg transition-opacity"
          >
            🔄 Recarregar
          </button>
        </div>
      </div>

      {/* Lista de Médicos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="w-8 h-8 border-4 border-azure-vivido border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando médicos...</p>
          </div>
        ) : medicos.length === 0 ? (
          <div className="p-4 text-center">
            <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum médico encontrado</h3>
            <p className="text-gray-600">
              {filtros.especialidade || filtros.busca ? 
                'Tente ajustar os filtros para encontrar médicos.' :
                'Nenhum médico foi cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {medicos.map((medico: Medico) => (
              <div key={medico.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      {/* Status */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        medico.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {medico.ativo ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {medico.ativo ? 'Ativo' : 'Inativo'}
                      </span>

                      {/* CRM */}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Shield className="w-3 h-3 mr-1" />
                        {medico.crm}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Nome e Especialidade */}
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{medico.nome}</p>
                          <p className="text-xs text-gray-500">{medico.especialidade}</p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{medico.email}</p>
                        </div>
                      </div>

                      {/* Telefone */}
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{medico.telefone}</p>
                        </div>
                      </div>

                      {/* Data de Cadastro */}
                      {medico.created_at && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Cadastrado em
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(medico.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleVerDetalhes(medico)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {usuario?.tipo === 'admin' && (
                      <>
                        <button
                          onClick={() => handleEditar(medico)}
                          className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Editar médico"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleAlterarStatus(medico.id, !medico.ativo)}
                          disabled={alterarStatusMutation.isLoading}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            medico.ativo 
                              ? 'text-gray-600 hover:text-red-600 hover:bg-red-50' 
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={medico.ativo ? 'Desativar médico' : 'Ativar médico'}
                        >
                          {medico.ativo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleDeletar(medico.id)}
                          disabled={deletarMedicoMutation.isLoading}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remover médico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {mostrarDetalhes && medicoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Detalhes do Médico</h3>
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    medicoSelecionado.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {medicoSelecionado.ativo ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    {medicoSelecionado.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Shield className="w-4 h-4 mr-2" />
                    CRM: {medicoSelecionado.crm}
                  </span>
                </div>

                {/* Informações do Médico */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Nome Completo</h4>
                    <p className="text-gray-700">{medicoSelecionado.nome}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Especialidade</h4>
                    <p className="text-gray-700">{medicoSelecionado.especialidade}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Email</h4>
                    <p className="text-gray-700">{medicoSelecionado.email}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Telefone</h4>
                    <p className="text-gray-700">{medicoSelecionado.telefone}</p>
                  </div>
                </div>

                {/* Data de Cadastro */}
                {medicoSelecionado.created_at && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cadastrado em</h4>
                    <p className="text-gray-700">
                      {new Date(medicoSelecionado.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Fechar
                </button>

                {usuario?.tipo === 'admin' && (
                  <button
                    onClick={() => {
                      setMostrarDetalhes(false);
                      handleEditar(medicoSelecionado);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Editar Médico
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulário */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {modoEdicao ? 'Editar Médico' : 'Novo Médico'}
                </h3>
                <button
                  onClick={handleFecharFormulario}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      {...register('nome', { required: 'Nome é obrigatório' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                      placeholder="Digite o nome completo"
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.nome.message}
                      </p>
                    )}
                  </div>

                  {/* Especialidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidade *
                    </label>
                    <select
                      {...register('especialidade', { required: 'Especialidade é obrigatória' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                    >
                      <option value="">Selecione uma especialidade</option>
                      {especialidades.map((esp) => (
                        <option key={esp} value={esp}>{esp}</option>
                      ))}
                    </select>
                    {errors.especialidade && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.especialidade.message}
                      </p>
                    )}
                  </div>

                  {/* CRM */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CRM *
                    </label>
                    <input
                      {...register('crm', { required: 'CRM é obrigatório' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                      placeholder="Ex: 12345-SP"
                    />
                    {errors.crm && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.crm.message}
                      </p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      {...register('telefone', { required: 'Telefone é obrigatório' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                    {errors.telefone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.telefone.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                      placeholder="medico@clinica.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register('ativo')}
                        className="w-4 h-4 text-azure-vivido border-gray-300 rounded focus:ring-azure-vivido"
                      />
                      <span className="text-sm font-medium text-gray-700">Médico ativo</span>
                    </label>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleFecharFormulario}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={criarMedicoMutation.isLoading || atualizarMedicoMutation.isLoading}
                    className="bg-verde-botao text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {(criarMedicoMutation.isLoading || atualizarMedicoMutation.isLoading) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>{modoEdicao ? 'Atualizando...' : 'Cadastrando...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{modoEdicao ? 'Atualizar Médico' : 'Cadastrar Médico'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicos;
