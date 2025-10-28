import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../types';
import { Eye, EyeOff, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.senha);
    } catch (error) {
      // O erro já é tratado pelo interceptor do axios
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-azure-vivido to-azul-principal flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-8 h-8 text-azure-vivido" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ClínicaMed</h1>
          <p className="text-white/80">Sistema de Agendamento Médico</p>
        </div>

        {/* Formulário de login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Entrar na sua conta
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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

            {/* Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
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

            {/* Botão de login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-verde-botao text-preto-fundo font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link para registro */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="text-azure-vivido hover:text-azul-principal font-medium transition-colors"
              >
                Cadastre-se aqui
              </Link>
            </p>
          </div>

          {/* Usuários de Teste */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
              🧪 Usuários para Teste
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">👨‍💼 Admin</span>
                  <p className="text-gray-600">admin@clinica.com</p>
                </div>
                <button
                  onClick={() => {
                    const emailInput = document.getElementById('email') as HTMLInputElement;
                    const senhaInput = document.getElementById('senha') as HTMLInputElement;
                    if (emailInput && senhaInput) {
                      emailInput.value = 'admin@clinica.com';
                      senhaInput.value = 'admin123';
                    }
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Usar
                </button>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">👨‍⚕️ Médico</span>
                  <p className="text-gray-600">michel@clinica.com</p>
                </div>
                <button
                  onClick={() => {
                    const emailInput = document.getElementById('email') as HTMLInputElement;
                    const senhaInput = document.getElementById('senha') as HTMLInputElement;
                    if (emailInput && senhaInput) {
                      emailInput.value = 'michel@clinica.com';
                      senhaInput.value = '123456';
                    }
                  }}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  Usar
                </button>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">👤 Paciente</span>
                  <p className="text-gray-600">joao.silva@email.com</p>
                </div>
                <button
                  onClick={() => {
                    const emailInput = document.getElementById('email') as HTMLInputElement;
                    const senhaInput = document.getElementById('senha') as HTMLInputElement;
                    if (emailInput && senhaInput) {
                      emailInput.value = 'joao.silva@email.com';
                      senhaInput.value = '123456';
                    }
                  }}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                >
                  Usar
                </button>
              </div>
            </div>
            <p className="text-center text-gray-500 mt-2 text-xs">
              Clique em "Usar" para preencher automaticamente
            </p>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-8 text-center text-white/80 text-sm">
          <p>Sistema desenvolvido para facilitar o agendamento de consultas médicas</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
