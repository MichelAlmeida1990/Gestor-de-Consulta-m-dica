import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../types';
import { 
  Eye, 
  EyeOff, 
  Stethoscope, 
  Calendar, 
  Users, 
  FileText, 
  Bell, 
  CreditCard,
  Shield,
  Clock,
  CheckCircle2,
  Heart,
  Pill,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const features = [
    {
      icon: Calendar,
      title: 'Agendamento Inteligente',
      description: 'Sistema avançado de agendamento com verificação automática de disponibilidade',
      color: 'text-azure-vivido'
    },
    {
      icon: Users,
      title: 'Gestão de Médicos',
      description: 'Cadastro completo de médicos com especialidades e disponibilidade',
      color: 'text-azul-principal'
    },
    {
      icon: FileText,
      title: 'Prontuários Eletrônicos',
      description: 'Prontuários digitais completos com histórico médico integrado',
      color: 'text-rosa-neon'
    },
    {
      icon: Bell,
      title: 'Notificações em Tempo Real',
      description: 'Sistema de notificações para lembretes e atualizações de consultas',
      color: 'text-marrom'
    },
    {
      icon: CreditCard,
      title: 'Gestão Financeira',
      description: 'Controle completo de pagamentos, faturas e receitas',
      color: 'text-azure-vivido'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Dados protegidos com criptografia e autenticação segura',
      color: 'text-azul-principal'
    }
  ];

  const services = [
    {
      title: 'Consultas Médicas',
      description: 'Agende consultas com médicos especialistas',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop'
    },
    {
      title: 'Exames Clínicos',
      description: 'Acompanhamento completo de exames e resultados',
      image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=300&fit=crop&auto=format'
    },
    {
      title: 'Prontuário Digital',
      description: 'Histórico médico completo e seguro',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop'
    },
    {
      title: 'Telemedicina',
      description: 'Consultas online com profissionais qualificados',
      image: 'https://images.unsplash.com/photo-1581056771107-24ca5f033042?w=400&h=300&fit=crop&auto=format'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-azul-principal via-azure-vivido to-azul-principal">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding */}
            <div className="text-white">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mr-4">
                  <Stethoscope className="w-10 h-10 text-azure-vivido" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">ClínicaMed</h1>
                  <p className="text-xl text-blue-100">Sistema de Agendamento Médico</p>
                </div>
              </div>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                A solução completa para gestão de consultas médicas, prontuários eletrônicos 
                e gestão financeira. Moderno, seguro e intuitivo.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-white/90">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span>100% Seguro</span>
                </div>
                <div className="flex items-center text-white/90">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span>Fácil de Usar</span>
                </div>
                <div className="flex items-center text-white/90">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span>24/7 Disponível</span>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure-vivido focus:border-transparent transition-all"
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
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure-vivido focus:border-transparent transition-all"
                      placeholder="Sua senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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
                  className="w-full bg-verde-botao text-preto-fundo font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Nossas Funcionalidades</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tudo que você precisa para uma gestão médica completa e eficiente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`w-14 h-14 ${feature.color} bg-opacity-10 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Services Section */}
      <div id="services" className="bg-gradient-to-br from-azul-principal to-azure-vivido py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Nossos Serviços</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Cuidado completo para sua saúde
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    onError={(e) => {
                      // Fallback para cor sólida com gradiente
                      const fallbackColors = {
                        'Consultas Médicas': 'bg-gradient-to-br from-blue-400 to-blue-600',
                        'Exames Clínicos': 'bg-gradient-to-br from-green-400 to-green-600',
                        'Prontuário Digital': 'bg-gradient-to-br from-purple-400 to-purple-600',
                        'Telemedicina': 'bg-gradient-to-br from-cyan-400 to-cyan-600'
                      };
                      const colorClass = fallbackColors[service.title as keyof typeof fallbackColors] || 'bg-gradient-to-br from-gray-400 to-gray-600';
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.fallback-gradient')) {
                        const fallback = document.createElement('div');
                        fallback.className = `fallback-gradient w-full h-full ${colorClass} flex items-center justify-center`;
                        fallback.innerHTML = `<span class="text-white font-bold text-lg">${service.title}</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg">{service.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-azure-vivido mb-2">100%</div>
              <div className="text-gray-600">Seguro</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-azure-vivido mb-2">24/7</div>
              <div className="text-gray-600">Disponível</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-azure-vivido mb-2">1000+</div>
              <div className="text-gray-600">Usuários</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-azure-vivido mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Professional */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand & Description */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-azure-vivido rounded-xl flex items-center justify-center mr-3">
                  <Stethoscope className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold">ClínicaMed</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Sistema completo de gestão médica para agendamento de consultas, 
                prontuários eletrônicos e gestão financeira.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700 hover:bg-azure-vivido rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700 hover:bg-azure-vivido rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700 hover:bg-azure-vivido rounded-lg flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700 hover:bg-azure-vivido rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-azure-vivido">Links Rápidos</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Cadastro
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Serviços
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-azure-vivido">Serviços</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#services" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Consultas Médicas
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Exames Clínicos
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Prontuário Digital
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Telemedicina
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Gestão Financeira
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-gray-400 hover:text-azure-vivido transition-colors text-sm">
                    Notificações
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-azure-vivido">Contato</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 text-azure-vivido flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Rua Administração, 1<br />Centro, São Paulo - SP<br />CEP: 01000-000</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-azure-vivido flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>(11) 99999-9999</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-azure-vivido flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>contato@clinicamed.com.br</span>
                </li>
                <li className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-azure-vivido flex-shrink-0" />
                  <span>Segunda a Sexta: 8h às 18h<br />Sábado: 8h às 12h</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="border-t border-gray-700 pt-8 mt-8">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <h4 className="text-lg font-semibold mb-2 text-azure-vivido">Receba Novidades</h4>
                <p className="text-gray-400 text-sm">
                  Cadastre-se para receber atualizações, dicas de saúde e novidades da clínica.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Seu email"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                />
                <button className="bg-verde-botao text-preto-fundo font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
                  Inscrever
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                © {new Date().getFullYear()} ClínicaMed. Todos os direitos reservados.
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <a href="#privacy" className="text-gray-400 hover:text-azure-vivido transition-colors">
                  Política de Privacidade
                </a>
                <a href="#terms" className="text-gray-400 hover:text-azure-vivido transition-colors">
                  Termos de Uso
                </a>
                <a href="#cookies" className="text-gray-400 hover:text-azure-vivido transition-colors">
                  Política de Cookies
                </a>
                <a href="#lgpd" className="text-gray-400 hover:text-azure-vivido transition-colors">
                  LGPD
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
