import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Calendar, 
  Users, 
  User, 
  Bell, 
  Settings,
  Stethoscope,
  BarChart3,
  Shield,
  FileText,
  X,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { usuario } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['paciente', 'medico', 'admin']
    },
    {
      icon: Calendar,
      label: 'Agendamento',
      path: '/agendamento',
      roles: ['paciente', 'medico', 'admin']
    },
    {
      icon: Users,
      label: 'Consultas',
      path: '/consultas',
      roles: ['paciente', 'medico', 'admin']
    },
    {
      icon: Stethoscope,
      label: 'Médicos',
      path: '/medicos',
      roles: ['paciente', 'medico', 'admin']
    },
    {
      icon: FileText,
      label: 'Prontuário',
      path: '/prontuario',
      roles: ['medico', 'admin']
    },
    {
      icon: DollarSign,
      label: 'Financeiro',
      path: '/financeiro',
      roles: ['paciente', 'medico', 'admin']
    },
    {
      icon: Bell,
      label: 'Notificações',
      path: '/notificacoes',
      roles: ['paciente', 'medico', 'admin']
    },
    {
      icon: User,
      label: 'Perfil',
      path: '/perfil',
      roles: ['paciente', 'medico', 'admin']
    },
    {
      icon: BarChart3,
      label: 'Estatísticas',
      path: '/admin/estatisticas',
      roles: ['admin']
    },
    {
      icon: Settings,
      label: 'Configurações',
      path: '/admin/configuracoes',
      roles: ['admin']
    },
    {
      icon: Shield,
      label: 'Administração',
      path: '/admin',
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(usuario?.tipo || '')
  );

  return (
    <div className={`w-64 h-full fixed left-0 top-0 z-20 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Efeito glassmorphism - Sidebar com transparência e blur */}
      <div className="w-full h-full bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl flex flex-col">
        {/* Logo e botão de fechar */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ClínicaMed</h1>
              <p className="text-xs text-white/80">Sistema de Agendamento</p>
            </div>
          </div>
          
          {/* Botão de fechar (visível apenas em mobile) */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-4 flex-1 overflow-y-auto">
        <div className="px-4 space-y-2 pb-4">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Fechar sidebar em mobile quando um link é clicado
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/30 backdrop-blur-md text-white shadow-lg border-l-4 border-white/50'
                    : 'text-white/90 hover:bg-white/20 hover:backdrop-blur-sm hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/80'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
        </nav>

        {/* User info */}
        <div className="mt-auto p-4 border-t border-white/20 bg-white/10 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {usuario?.nome}
            </p>
            <p className="text-xs text-white/80 capitalize">
              {usuario?.tipo}
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
