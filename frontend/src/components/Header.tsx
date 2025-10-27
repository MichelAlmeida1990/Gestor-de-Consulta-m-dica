import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, LogOut, User, Menu, X } from 'lucide-react';
import { notificacaoService } from '../services/api';
import { useQuery } from 'react-query';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { usuario, logout } = useAuth();

  // Buscar notificações não lidas
  const { data: notificacoesData } = useQuery(
    'notificacoes-nao-lidas',
    () => notificacaoService.getNaoLidas(),
    {
      refetchInterval: 30000, // Atualizar a cada 30 segundos
      enabled: !!usuario
    }
  );

  const notificacoesNaoLidas = notificacoesData?.data?.count || 0;

  return (
    <header className="h-16 bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 h-full flex items-center justify-between">
        {/* Botão de toggle do sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Título */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Sistema de Agendamento
          </h1>
        </div>

        {/* Notificações e perfil */}
        <div className="flex items-center space-x-4">
          {/* Notificações */}
          <div className="relative">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {notificacoesNaoLidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
                </span>
              )}
            </button>
          </div>

          {/* Perfil */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-azure-vivido rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {usuario?.nome}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
