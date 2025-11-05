import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, LogOut, User, Menu, X, ChevronDown } from 'lucide-react';
import { notificacaoService } from '../services/api';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { usuario, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    toast.success('Logout realizado com sucesso!');
    logout();
    setShowUserMenu(false);
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
    <header className="h-16 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg sticky top-0 z-10">
      <div className="px-6 h-full flex items-center justify-between">
        {/* Botão de toggle do sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm lg:hidden"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Título */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">
            {usuario?.tipo === 'admin' && '👨‍💼 Painel Administrativo'}
            {usuario?.tipo === 'medico' && '👨‍⚕️ Painel do Médico'}
            {usuario?.tipo === 'paciente' && '👤 Meu Painel'}
            {!usuario?.tipo && 'Sistema de Agendamento'}
          </h1>
        </div>

        {/* Notificações e perfil */}
        <div className="flex items-center space-x-4">
          {/* Notificações */}
          <div className="relative">
            <button className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm">
              <Bell className="w-5 h-5" />
              {notificacoesNaoLidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-white">
                  {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
                </span>
              )}
            </button>
          </div>

          {/* Perfil com Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/30">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-white">
                  {usuario?.nome}
                </span>
                <span className="text-xs text-white/80 capitalize">
                  {usuario?.tipo === 'admin' && 'Administrador'}
                  {usuario?.tipo === 'medico' && 'Médico'}
                  {usuario?.tipo === 'paciente' && 'Paciente'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/80 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200/50">
                  <p className="text-sm font-medium text-gray-900">{usuario?.nome}</p>
                  <p className="text-xs text-gray-500">{usuario?.email}</p>
                </div>
                
                <div className="py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sair da Conta
                  </button>
                </div>
                
                <div className="px-4 py-2 bg-gray-50/50 rounded-b-xl">
                  <p className="text-xs text-gray-500 text-center">
                    Trocar de usuário para testar diferentes perfis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
