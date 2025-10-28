import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardAdmin from '../components/DashboardAdmin';
import DashboardMedico from '../components/DashboardMedico';
import DashboardPaciente from '../components/DashboardPaciente';

const Dashboard: React.FC = () => {
  const { usuario } = useAuth();

  // Renderizar dashboard baseado no tipo de usuário
  if (usuario?.tipo === 'admin') {
    return <DashboardAdmin />;
  }

  if (usuario?.tipo === 'medico') {
    return <DashboardMedico />;
  }

  if (usuario?.tipo === 'paciente') {
    return <DashboardPaciente />;
  }

  // Fallback para usuários sem tipo definido
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Bem-vindo ao sistema de agendamento médico!
        </p>
      </div>
    </div>
  );
};

export default Dashboard;