import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Usuario, Medico, AuthContextType, RegisterForm } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [medico, setMedico] = useState<Medico | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  // Inicialização - apenas restaurar dados do localStorage
  useEffect(() => {
    // Evitar execução dupla usando ref (não causa re-render)
    if (hasInitialized.current) {
      console.log('⚠️ useEffect já executado, ignorando...');
      return;
    }

    console.log('🔄 Inicializando autenticação...');
    hasInitialized.current = true;
    
    const savedToken = localStorage.getItem('token');
    const savedUsuario = localStorage.getItem('usuario');
    const savedMedico = localStorage.getItem('medico');

    if (savedToken && savedUsuario) {
      try {
        const parsedUsuario = JSON.parse(savedUsuario);
        
        // Verificar se não é token mock
        if (!savedToken.startsWith('mock-token-')) {
          console.log('✅ Restaurando dados do localStorage');
          // Atualizar estado de forma síncrona
          setToken(savedToken);
          setUsuario(parsedUsuario);
          
          if (savedMedico) {
            const parsedMedico = JSON.parse(savedMedico);
            setMedico(parsedMedico);
          }
        } else {
          console.log('⚠️ Token mock detectado, limpando dados');
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          localStorage.removeItem('medico');
        }
      } catch (error) {
        console.error('❌ Erro ao restaurar dados:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('medico');
      }
    } else {
      console.log('⚠️ Nenhum token ou usuário encontrado no localStorage');
    }
    
    // Finalizar loading imediatamente (sem delay)
    console.log('✅ Inicialização concluída');
    setIsLoading(false);
  }, []); // Array vazio - executa apenas uma vez

  const login = async (email: string, senha: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🔐 Iniciando login...');
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });
      
      const data = await response.json();
      console.log('📡 Resposta do login:', data);
      
      if (data.success) {
        const { token: newToken, usuario: newUsuario } = data.data;
        
        console.log('✅ Login bem-sucedido, salvando dados:', {
          token: newToken?.substring(0, 20) + '...',
          usuario: newUsuario
        });
        
        // Salvar no localStorage PRIMEIRO
        localStorage.setItem('token', newToken);
        localStorage.setItem('usuario', JSON.stringify(newUsuario));
        
        console.log('✅ Dados salvos no localStorage');
        
        // Atualizar estado ANTES de redirecionar
        setToken(newToken);
        setUsuario(newUsuario);
        
        console.log('✅ Estado atualizado');
        
        toast.success('Login realizado com sucesso!');
        
        // Marcar que acabou de fazer login (evita toast de sessão expirada imediatamente)
        if (typeof window !== 'undefined' && (window as any).setJustLoggedIn) {
          (window as any).setJustLoggedIn();
        }
        
        // Aguardar um momento para garantir que o estado foi atualizado e evitar race conditions
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verificar novamente se o token ainda está salvo antes de redirecionar
        const tokenAindaSalvo = localStorage.getItem('token');
        if (tokenAindaSalvo === newToken) {
          console.log('🔄 Redirecionando para dashboard...');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('⚠️ Token foi limpo antes do redirecionamento, cancelando...');
        }
        
      } else {
        console.error('❌ Login falhou:', data.error);
        toast.error(data.error?.message || 'Erro ao fazer login');
        throw new Error(data.error?.message || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      toast.error('Erro de conexão com o servidor');
      throw error;
    } finally {
      console.log('🏁 Finalizando login, setIsLoading(false)');
      setIsLoading(false);
    }
  };

  const register = async (dados: RegisterForm): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const { token: newToken, usuario: newUsuario } = data.data;
        
        setToken(newToken);
        setUsuario(newUsuario);
        
        // Salvar no localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('usuario', JSON.stringify(newUsuario));
        
        toast.success('Cadastro realizado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error(data.error?.message || 'Erro no cadastro');
        throw new Error(data.error?.message || 'Erro no cadastro');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro ao fazer cadastro. Tente novamente.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    console.log('🚪 Fazendo logout...');
    setToken(null);
    setUsuario(null);
    setMedico(null);
    
    // Limpar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('medico');
    
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  const isAuthenticated = !!token && !!usuario;

  // Escutar evento de logout do interceptor
  useEffect(() => {
    const handleAuthLogout = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔐 Evento de logout recebido:', customEvent.detail);
      setToken(null);
      setUsuario(null);
      setMedico(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [navigate]);

  // Log para debug do estado de autenticação
  useEffect(() => {
    console.log('🔍 Estado de autenticação atualizado:', {
      hasToken: !!token,
      hasUsuario: !!usuario,
      isAuthenticated,
      tokenPreview: token?.substring(0, 20) + '...',
      usuarioEmail: usuario?.email
    });
  }, [token, usuario, isAuthenticated]);

  const value: AuthContextType = {
    usuario,
    medico,
    token,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};