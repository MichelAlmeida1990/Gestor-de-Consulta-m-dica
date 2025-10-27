import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { RegisterForm } from '../types';
import { Eye, EyeOff, Stethoscope, User, Mail, Lock, Phone, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('senha');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data);
    } catch (error) {
      // O erro já é tratado pelo interceptor do axios
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-azure-vivido to-azul-principal flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-8 h-8 text-azure-vivido" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ClínicaMed</h1>
          <p className="text-white/80">Crie sua conta no sistema</p>
        </div>

        {/* Formulário de registro */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Criar nova conta
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nome completo
                </label>
                <input
                  {...register('nome', {
                    required: 'Nome é obrigatório',
                    minLength: {
                      value: 2,
                      message: 'Nome deve ter pelo menos 2 caracteres'
                    }
                  })}
                  type="text"
                  id="nome"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                  placeholder="Seu nome completo"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  {...register('email', {
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone
                </label>
                <input
                  {...register('telefone', {
                    pattern: {
                      value: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
                      message: 'Telefone deve estar no formato (XX) XXXXX-XXXX'
                    }
                  })}
                  type="tel"
                  id="telefone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && (
                  <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>
                )}
              </div>

              {/* Data de nascimento */}
              <div>
                <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de nascimento
                </label>
                <input
                  {...register('data_nascimento')}
                  type="date"
                  id="data_nascimento"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                />
              </div>
            </div>

            {/* Tipo de usuário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de conta
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    {...register('tipo', { required: 'Tipo é obrigatório' })}
                    type="radio"
                    value="paciente"
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Paciente</div>
                    <div className="text-sm text-gray-500">Agendar consultas</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    {...register('tipo', { required: 'Tipo é obrigatório' })}
                    type="radio"
                    value="medico"
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Médico</div>
                    <div className="text-sm text-gray-500">Atender pacientes</div>
                  </div>
                </label>
              </div>
              {errors.tipo && (
                <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>
              )}
            </div>

            {/* Senhas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Senha */}
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Senha
                </label>
                <div className="relative">
                  <input
                    {...register('senha', {
                      required: 'Senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'Senha deve ter pelo menos 6 caracteres'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="senha"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="mt-1 text-sm text-red-600">{errors.senha.message}</p>
                )}
              </div>

              {/* Confirmar senha */}
              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    {...register('confirmarSenha', {
                      required: 'Confirmação de senha é obrigatória',
                      validate: (value) =>
                        value === password || 'As senhas não coincidem'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmarSenha"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                    placeholder="Confirme sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmarSenha && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmarSenha.message}</p>
                )}
              </div>
            </div>

            {/* Botão de registro */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-verde-botao text-preto-fundo font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          {/* Link para login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="text-azure-vivido hover:text-azul-principal font-medium transition-colors"
              >
                Faça login aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
