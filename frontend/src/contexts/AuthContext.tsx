import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, Medico, AuthContextType, LoginForm, RegisterForm } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [medico, setMedico] = useState<Medico | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se há dados salvos no localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUsuario = localStorage.getItem('usuario');
    const savedMedico = localStorage.getItem('medico');

    if (savedToken && savedUsuario) {
      setToken(savedToken);
      setUsuario(JSON.parse(savedUsuario));
      if (savedMedico) {
        setMedico(JSON.parse(savedMedico));
      }
    }
  }, []);

  const login = async (email: string, senha: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Usar fetch diretamente para evitar problemas de configuração
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const { token: newToken, usuario: newUsuario } = data.data;
        
        setToken(newToken);
        setUsuario(newUsuario);
        
        // Salvar no localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('usuario', JSON.stringify(newUsuario));
        
        toast.success('Login realizado com sucesso!');
      } else {
        toast.error(data.error?.message || 'Erro no login');
        throw new Error(data.error?.message || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
      throw error;
    } finally {
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
    setToken(null);
    setUsuario(null);
    setMedico(null);
    
    // Limpar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('medico');
    
    toast.success('Logout realizado com sucesso!');
  };

  const isAuthenticated = !!token && !!usuario;

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
