import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { 
  FileText, 
  User, 
  Calendar, 
  Stethoscope, 
  Pill, 
  Activity,
  Download,
  Edit,
  Plus,
  CheckCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { prontuarioService, pacienteService, consultaService } from '../services/api';

interface Paciente {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  dataNascimento?: string;
  cpf?: string;
  endereco?: string;
  usuario_id?: number;
  usuario?: {
    nome: string;
    email: string;
    telefone?: string;
  };
}

interface Consulta {
  id: number;
  data: string;
  horario: string;
  tipo_consulta?: string;
  tipo?: string;
  status: string;
  observacoes?: string;
  paciente?: {
    id: number;
    usuario?: {
      nome: string;
      email: string;
    };
  };
  medico: {
    id?: number;
    nome?: string;
    especialidade: string;
    usuario?: {
      nome: string;
      email: string;
    };
  };
}

interface Prontuario {
  id: number;
  paciente_id: number;
  consulta_id: number;
  anamnese: {
    motivoConsulta: string;
    historiaDoenca: string;
    sintomas: string[];
    medicamentosAtuais: string[];
    alergias: string[];
    antecedentesFamiliares: string;
    habitos: {
      fuma: boolean;
      bebe: boolean;
      exercicios: string;
      alimentacao: string;
    };
  };
  exameFisico: {
    pressaoArterial: string;
    frequenciaCardiaca: string;
    temperatura: string;
    peso: string;
    altura: string;
    imc: string;
    observacoes: string;
  };
  diagnostico: {
    principal: string;
    secundarios: string[];
    cid: string;
  };
  prescricao: {
    medicamentos: Array<{
      nome: string;
      dosagem: string;
      frequencia: string;
      duracao: string;
      observacoes: string;
    }>;
    exames: Array<{
      tipo: string;
      descricao: string;
      urgencia: string;
    }>;
    orientacoes: string;
  };
  evolucao: string;
  proximaConsulta: string;
  created_at: string;
  updated_at: string;
}

const Prontuario: React.FC = () => {
  const { usuario } = useAuth();
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [abaAtiva, setAbaAtiva] = useState('anamnese');
  const [modoTelaCheia, setModoTelaCheia] = useState(false);

  // Buscar pacientes da API
  const { data: pacientesData, isLoading: carregandoPacientes, error: pacientesError } = useQuery(
    'pacientes-prontuario',
    () => pacienteService.listar(),
    { 
      enabled: !!usuario,
      onSuccess: (data) => {
        console.log('✅ Pacientes carregados:', data?.data?.length || 0);
        console.log('📋 Dados dos pacientes:', data?.data);
      },
      onError: (error: any) => {
        console.error('❌ Erro ao carregar pacientes:', error);
        console.error('❌ Status:', error.response?.status);
        console.error('❌ Data:', error.response?.data);
      }
    }
  );

  // Buscar TODAS as consultas da API (agendadas, confirmadas, realizadas)
  const { data: consultasData, isLoading: carregandoConsultas } = useQuery(
    'consultas-prontuario',
    () => consultaService.listar({ page: 1, limit: 100 }),
    { 
      enabled: !!usuario,
      onSuccess: (data) => {
        console.log('✅ Consultas carregadas:', data?.data?.consultas?.length || 0);
      },
      onError: (error: any) => {
        console.error('❌ Erro ao carregar consultas:', error);
      }
    }
  );

  const pacientes = pacientesData?.data || [];
  const todasConsultas = consultasData?.data?.consultas || consultasData?.data || [];
  
  // Filtrar consultas do paciente selecionado AUTOMATICAMENTE
  const consultas = pacienteSelecionado 
    ? todasConsultas.filter((c: any) => {
        // O paciente selecionado pode ter id da tabela pacientes OU usuario_id
        const pacienteIdSelecionado = pacienteSelecionado.id;
        const pacienteUsuarioId = pacienteSelecionado.usuario_id || pacienteSelecionado.id;
        
        // A consulta pode ter paciente_id (id da tabela pacientes) ou paciente.usuario_id
        const pacienteIdConsulta = c.paciente?.id || c.paciente_id;
        const usuarioIdConsulta = c.paciente?.usuario?.id || c.paciente?.usuario_id;
        
        // Comparar de múltiplas formas para garantir que funciona
        return pacienteIdConsulta === pacienteIdSelecionado || 
               usuarioIdConsulta === pacienteUsuarioId ||
               c.paciente_id === pacienteIdSelecionado ||
               (c.paciente && c.paciente.id === pacienteIdSelecionado) ||
               (c.paciente && c.paciente.usuario && c.paciente.usuario.id === pacienteUsuarioId);
      })
    : [];

  // Buscar prontuário específico da consulta selecionada
  const { data: prontuarioAtual } = useQuery(
    ['prontuario-consulta', consultaSelecionada?.id],
    () => prontuarioService.buscarPorConsulta(consultaSelecionada!.id),
    { 
      enabled: !!consultaSelecionada,
      select: (data) => data.data?.[0] || null
    }
  );

  // Mutação para criar prontuário
  // Mutations removidas - não utilizadas

  const handleSelecionarPaciente = (paciente: Paciente) => {
    console.log('👤 Paciente selecionado:', paciente);
    setPacienteSelecionado(paciente);
    setConsultaSelecionada(null);
  };
  
  // Selecionar automaticamente a primeira consulta quando o paciente é selecionado e há consultas
  useEffect(() => {
    if (pacienteSelecionado && consultas.length > 0 && !consultaSelecionada) {
      console.log('✅ Selecionando automaticamente a primeira consulta do paciente');
      setConsultaSelecionada(consultas[0]);
    }
  }, [pacienteSelecionado, consultas, consultaSelecionada]);
  
  // Log para debug
  useEffect(() => {
    console.log('🔍 Estado atual do Prontuário:', {
      pacientesTotal: pacientes.length,
      consultasTotal: todasConsultas.length,
      consultasFiltradas: consultas.length,
      pacienteSelecionado: pacienteSelecionado?.nome || pacienteSelecionado?.usuario?.nome,
      consultaSelecionada: consultaSelecionada?.id
    });
  }, [pacientes, todasConsultas, consultas, pacienteSelecionado, consultaSelecionada]);

  const handleSelecionarConsulta = (consulta: Consulta) => {
    setConsultaSelecionada(consulta);
    // Função removida - não implementada
  };

  const handleNovoProntuario = () => {
    if (!consultaSelecionada) {
      toast.error('Selecione uma consulta primeiro');
      return;
    }
    // Função removida - não implementada
  };

  const abas = [
    { id: 'anamnese', label: 'Anamnese', icon: User },
    { id: 'exame', label: 'Exame Físico', icon: Stethoscope },
    { id: 'diagnostico', label: 'Diagnóstico', icon: Activity },
    { id: 'prescricao', label: 'Prescrição', icon: Pill },
    { id: 'evolucao', label: 'Evolução', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prontuário Eletrônico</h1>
              <p className="text-gray-600">Sistema completo de prontuário médico digital</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {pacienteSelecionado && (
              <span className="text-sm text-gray-500">
                Paciente: {pacienteSelecionado.nome}
              </span>
            )}
            <button
              onClick={() => setModoTelaCheia(!modoTelaCheia)}
              className={`px-3 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                modoTelaCheia 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={modoTelaCheia ? 'Voltar ao layout normal' : 'Modo tela cheia'}
            >
              {modoTelaCheia ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {modoTelaCheia ? 'Normal' : 'Tela Cheia'}
              </span>
            </button>
            <button
              onClick={handleNovoProntuario}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Prontuário</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${modoTelaCheia ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Lista de Pacientes e Consultas - Escondida no modo tela cheia */}
        {!modoTelaCheia && (
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Pacientes
                </h3>
              </div>
              <div className="p-4">
                {carregandoPacientes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Carregando pacientes...</p>
                  </div>
                ) : pacientesError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">Erro ao carregar pacientes</p>
                    <p className="text-xs text-gray-500 mt-2">{pacientesError.message}</p>
                  </div>
                ) : pacientes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum paciente encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pacientes.map((paciente: any) => (
                      <div
                        key={paciente.id}
                        onClick={() => handleSelecionarPaciente(paciente)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          pacienteSelecionado?.id === paciente.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {paciente.nome || paciente.usuario?.nome || 'Nome não disponível'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {paciente.email || paciente.usuario?.email || 'Email não disponível'}
                            </p>
                            {paciente.dataNascimento && (
                              <p className="text-xs text-gray-400">
                                {new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()} anos
                              </p>
                            )}
                          </div>
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Consultas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-green-600" />
                  Consultas
                </h3>
              </div>
              <div className="p-4">
                {carregandoConsultas ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Carregando consultas...</p>
                  </div>
                ) : pacienteSelecionado ? (
                  <div className="space-y-3">
                    {consultas.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Nenhuma consulta encontrada para este paciente</p>
                      </div>
                    ) : (
                      consultas.map((consulta: any) => {
                        const medicoNome = consulta.medico?.usuario?.nome || consulta.medico?.nome || 'Nome não disponível';
                        const medicoEspecialidade = consulta.medico?.especialidade || 'Especialidade não informada';
                        const status = consulta.status || 'agendada';
                        
                        const statusColors: any = {
                          agendada: 'bg-blue-100 text-blue-800',
                          confirmada: 'bg-green-100 text-green-800',
                          realizada: 'bg-gray-100 text-gray-800',
                          cancelada: 'bg-red-100 text-red-800'
                        };
                        
                        const statusLabels: any = {
                          agendada: 'Agendada',
                          confirmada: 'Confirmada',
                          realizada: 'Realizada',
                          cancelada: 'Cancelada'
                        };
                        
                        return (
                          <div
                            key={consulta.id}
                            onClick={() => handleSelecionarConsulta(consulta)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              consultaSelecionada?.id === consulta.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(consulta.data).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-xs text-gray-500">{consulta.horario}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700">{medicoNome}</p>
                            <p className="text-xs text-gray-500">{medicoEspecialidade}</p>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {statusLabels[status] || status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Selecione um paciente para ver as consultas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prontuário */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${modoTelaCheia ? 'col-span-1' : 'lg:col-span-2'}`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Prontuário
              </h3>
              {modoTelaCheia && consultaSelecionada && (
                <div className="text-right text-sm text-gray-600">
                  <p className="font-medium">
                    {consultaSelecionada.paciente?.usuario?.nome || 'Paciente não encontrado'}
                  </p>
                  <p className="text-xs">{consultaSelecionada.data} às {consultaSelecionada.horario}</p>
                  <p className="text-xs">
                    {consultaSelecionada.medico?.usuario?.nome || consultaSelecionada.medico?.nome || 'Médico não encontrado'} - {consultaSelecionada.medico?.especialidade || 'Especialidade não informada'}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="p-4">
            {consultaSelecionada ? (
              <div className="space-y-4">
                {/* Abas */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  {abas.map((aba) => {
                    const Icon = aba.icon;
                    return (
                      <button
                        key={aba.id}
                        onClick={() => setAbaAtiva(aba.id)}
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          abaAtiva === aba.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-1" />
                        {aba.label}
                      </button>
                    );
                  })}
                </div>

                {/* Conteúdo das Abas */}
                <div className="space-y-4">
                  {abaAtiva === 'anamnese' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Motivo da Consulta
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.anamnese?.motivoConsulta || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          História da Doença
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.anamnese?.historiaDoenca || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sintomas
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {prontuarioAtual?.anamnese?.sintomas?.map((sintoma: any, index: number) => (
                            <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                              {sintoma}
                            </span>
                          )) || <span className="text-gray-500">Nenhum sintoma registrado</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {abaAtiva === 'exame' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pressão Arterial
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.exameFisico?.pressaoArterial || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequência Cardíaca
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.exameFisico?.frequenciaCardiaca || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temperatura
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.exameFisico?.temperatura || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          IMC
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.exameFisico?.imc || 'Não informado'}
                        </p>
                      </div>
                    </div>
                  )}

                  {abaAtiva === 'diagnostico' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Diagnóstico Principal
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.diagnostico?.principal || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CID-10
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.diagnostico?.cid || 'Não informado'}
                        </p>
                      </div>
                    </div>
                  )}

                  {abaAtiva === 'prescricao' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medicamentos
                        </label>
                        <div className="space-y-2">
                          {prontuarioAtual?.prescricao?.medicamentos?.map((med: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <p className="font-medium text-gray-900">{med.nome}</p>
                              <p className="text-sm text-gray-600">
                                {med.dosagem} - {med.frequencia} - {med.duracao}
                              </p>
                              <p className="text-xs text-gray-500">{med.observacoes}</p>
                            </div>
                          )) || <p className="text-gray-500">Nenhum medicamento prescrito</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exames Solicitados
                        </label>
                        <div className="space-y-2">
                          {prontuarioAtual?.prescricao?.exames?.map((exame: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <p className="font-medium text-gray-900">{exame.tipo}</p>
                              <p className="text-sm text-gray-600">{exame.descricao}</p>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {exame.urgencia}
                              </span>
                            </div>
                          )) || <p className="text-gray-500">Nenhum exame solicitado</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {abaAtiva === 'evolucao' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Evolução
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.evolucao || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Próxima Consulta
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {prontuarioAtual?.proximaConsulta ? 
                            new Date(prontuarioAtual.proximaConsulta).toLocaleDateString('pt-BR') : 
                            'Não agendada'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4 mr-2 inline" />
                    Exportar PDF
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Edit className="w-4 h-4 mr-2 inline" />
                    Editar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Selecione uma consulta para ver o prontuário</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prontuario;
