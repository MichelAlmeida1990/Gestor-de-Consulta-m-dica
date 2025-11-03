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
    <div className={`w-64 bg-white shadow-lg h-full fixed left-0 top-0 z-20 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Logo e botão de fechar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-azure-vivido rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">ClínicaMed</h1>
              <p className="text-xs text-gray-500">Sistema de Agendamento</p>
            </div>
          </div>
          
          {/* Botão de fechar (visível apenas em mobile) */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Menu */}
      <nav className="mt-4">
        <div className="px-4 space-y-1">
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
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-azure-vivido text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-azure-vivido rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {usuario?.nome}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {usuario?.tipo}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
