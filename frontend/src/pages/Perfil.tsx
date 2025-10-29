import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useTelefoneFormat } from '../hooks/useTelefoneFormat';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Save, 
  Edit, 
  Eye, 
  EyeOff,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PerfilForm {
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  endereco: string;
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

const Perfil: React.FC = () => {
  const { usuario } = useAuth();
  const [mostrarSenhas, setMostrarSenhas] = useState({
    atual: false,
    nova: false,
    confirmar: false
  });
  const [modoEdicao, setModoEdicao] = useState(false);
  
  // Hook para formatação de telefone
  const telefoneFormat = useTelefoneFormat();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PerfilForm>();

  // Preencher formulário com dados do usuário
  useEffect(() => {
    if (usuario) {
      setValue('nome', usuario.nome);
      setValue('email', usuario.email);
      telefoneFormat.setFormattedValue(usuario.telefone || '');
      setValue('telefone', usuario.telefone || '');
      setValue('dataNascimento', usuario.data_nascimento || '');
      setValue('endereco', usuario.endereco || '');
    }
  }, [usuario, setValue, telefoneFormat]);

  const onSubmit = async (data: PerfilForm) => {
    try {
      // Aqui você implementaria a lógica de atualização do perfil
      console.log('Dados do perfil:', data);
      toast.success('Perfil atualizado com sucesso!');
      setModoEdicao(false);
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const toggleMostrarSenha = (campo: 'atual' | 'nova' | 'confirmar') => {
    setMostrarSenhas(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais</p>
            </div>
          </div>
        </div>

        {/* Formulário de Perfil */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2>
            <button
              onClick={() => setModoEdicao(!modoEdicao)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center ${
                modoEdicao 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {modoEdicao ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nome Completo *
                </label>
                <input
                  {...register('nome', { required: 'Nome é obrigatório' })}
                  disabled={!modoEdicao}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                    modoEdicao 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Seu nome completo"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.nome.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email *
                </label>
                <input
                  {...register('email', { 
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Email inválido'
                    }
                  })}
                  disabled={!modoEdicao}
                  type="email"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                    modoEdicao 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone *
                </label>
                <input
                  {...register('telefone', { 
                    required: 'Telefone é obrigatório',
                    pattern: {
                      value: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
                      message: 'Formato inválido. Use (XX) XXXXX-XXXX'
                    }
                  })}
                  value={telefoneFormat.value}
                  onChange={(e) => {
                    if (modoEdicao) {
                      telefoneFormat.handleChange(e);
                      setValue('telefone', telefoneFormat.getNumbersOnly());
                    }
                  }}
                  disabled={!modoEdicao}
                  type="tel"
                  maxLength={15}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                    modoEdicao 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.telefone.message}
                  </p>
                )}
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Nascimento
                </label>
                <input
                  {...register('dataNascimento')}
                  disabled={!modoEdicao}
                  type="date"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                    modoEdicao 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Endereço
              </label>
              <textarea
                {...register('endereco')}
                disabled={!modoEdicao}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none ${
                  modoEdicao 
                    ? 'border-gray-300 bg-white' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>

            {/* Alteração de Senha */}
            {modoEdicao && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alterar Senha</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Senha Atual */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <input
                        {...register('senhaAtual')}
                        type={mostrarSenhas.atual ? 'text' : 'password'}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => toggleMostrarSenha('atual')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarSenhas.atual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nova Senha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        {...register('novaSenha', {
                          minLength: {
                            value: 6,
                            message: 'Senha deve ter pelo menos 6 caracteres'
                          }
                        })}
                        type={mostrarSenhas.nova ? 'text' : 'password'}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Digite a nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => toggleMostrarSenha('nova')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarSenhas.nova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.novaSenha && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.novaSenha.message}
                      </p>
                    )}
                  </div>

                  {/* Confirmar Senha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <input
                        {...register('confirmarSenha', {
                          validate: (value) => {
                            const novaSenha = watch('novaSenha');
                            return value === novaSenha || 'Senhas não coincidem';
                          }
                        })}
                        type={mostrarSenhas.confirmar ? 'text' : 'password'}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Confirme a nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => toggleMostrarSenha('confirmar')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {mostrarSenhas.confirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmarSenha && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.confirmarSenha.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            {modoEdicao && (
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setModoEdicao(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
