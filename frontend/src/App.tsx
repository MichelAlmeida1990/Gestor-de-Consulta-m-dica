import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Componentes de páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Agendamento from './pages/Agendamento';
import Consultas from './pages/Consultas';
import Medicos from './pages/Medicos';
import Perfil from './pages/Perfil';
import Notificacoes from './pages/Notificacoes';
import Prontuario from './pages/Prontuario';
import Financeiro from './pages/Financeiro';
import Admin from './pages/Admin';

// Componentes de layout
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, usuario, isLoading } = useAuth();

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Verificar se há token no localStorage (mais confiável do que apenas isAuthenticated)
  const hasToken = localStorage.getItem('token');
  const hasUsuario = localStorage.getItem('usuario');
  
  // Se não está autenticado E não há token no localStorage, redirecionar para login
  if (!isAuthenticated && (!hasToken || !hasUsuario)) {
    return <Navigate to="/login" replace />;
  }

  // Se requer role específica e usuário não tem, redirecionar para dashboard
  if (requiredRole && usuario?.tipo !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Tudo ok, renderizar children
  return <>{children}</>;
};

// Componente principal da aplicação
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading enquanto inicializa
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        } 
      />

      {/* Rotas protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agendamento"
        element={
          <ProtectedRoute>
            <Layout>
              <Agendamento />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultas"
        element={
          <ProtectedRoute>
            <Layout>
              <Consultas />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicos"
        element={
          <ProtectedRoute>
            <Layout>
              <Medicos />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prontuario"
        element={
          <ProtectedRoute>
            <Layout>
              <Prontuario />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <Layout>
              <Financeiro />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Layout>
              <Perfil />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notificacoes"
        element={
          <ProtectedRoute>
            <Layout>
              <Notificacoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Rotas apenas para admin */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Rota padrão - apenas para root */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
      } />
      
      {/* Rota catch-all - redirecionar apenas se autenticado */}
      <Route path="*" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
};

// Componente principal
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;