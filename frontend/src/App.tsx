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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && usuario?.tipo !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente principal da aplicação
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

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
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/agendamento" element={<Agendamento />} />
                <Route path="/consultas" element={<Consultas />} />
                <Route path="/medicos" element={<Medicos />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/notificacoes" element={<Notificacoes />} />
                
                {/* Rotas apenas para admin */}
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Admin />
                    </ProtectedRoute>
                  } 
                />

                {/* Rota padrão */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
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
