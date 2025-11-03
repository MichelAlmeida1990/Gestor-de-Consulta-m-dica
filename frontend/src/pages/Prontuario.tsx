import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
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
  const [modoEdicao, setModoEdicao] = useState(false);
  const queryClient = useQueryClient();
  
  const { register: registerForm, handleSubmit: handleSubmitForm, setValue, watch, formState: { errors } } = useForm();

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
  const { data: prontuarioData, refetch: refetchProntuario } = useQuery(
    ['prontuario-consulta', consultaSelecionada?.id],
    () => prontuarioService.buscarPorConsulta(consultaSelecionada!.id),
    { 
      enabled: !!consultaSelecionada?.id,
      select: (data) => {
        const prontuario = data.data?.[0] || null;
        if (prontuario && modoEdicao) {
          // Preencher formulário quando entrar em modo edição
          setTimeout(() => {
            if (prontuario.anamnese) {
              Object.keys(prontuario.anamnese).forEach(key => {
                setValue(`anamnese.${key}`, prontuario.anamnese[key]);
              });
            }
            if (prontuario.exame_fisico) {
              Object.keys(prontuario.exame_fisico).forEach(key => {
                setValue(`exame_fisico.${key}`, prontuario.exame_fisico[key]);
              });
            }
            if (prontuario.diagnostico) {
              Object.keys(prontuario.diagnostico).forEach(key => {
                setValue(`diagnostico.${key}`, prontuario.diagnostico[key]);
              });
            }
            if (prontuario.prescricao) {
              Object.keys(prontuario.prescricao).forEach(key => {
                setValue(`prescricao.${key}`, prontuario.prescricao[key]);
              });
            }
            setValue('observacoes', prontuario.observacoes || '');
          }, 100);
        }
        return prontuario;
      }
    }
  );

  const prontuarioAtual = prontuarioData || null;

  // Mutação para criar prontuário
  const criarProntuarioMutation = useMutation(
    (dados: any) => prontuarioService.criar(dados),
    {
      onSuccess: () => {
        toast.success('Prontuário criado com sucesso!');
        queryClient.invalidateQueries(['prontuario-consulta', consultaSelecionada?.id]);
        queryClient.invalidateQueries('consultas-prontuario');
        setModoEdicao(false);
        refetchProntuario();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao criar prontuário');
      }
    }
  );

  // Mutação para atualizar prontuário
  const atualizarProntuarioMutation = useMutation(
    ({ id, dados }: { id: number; dados: any }) => prontuarioService.atualizar(id, dados),
    {
      onSuccess: () => {
        toast.success('Prontuário atualizado com sucesso!');
        queryClient.invalidateQueries(['prontuario-consulta', consultaSelecionada?.id]);
        queryClient.invalidateQueries('consultas-prontuario');
        setModoEdicao(false);
        refetchProntuario();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao atualizar prontuário');
      }
    }
  );

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
    setModoEdicao(true);
    
    // Se já existe prontuário, preencher com dados existentes
    if (prontuarioAtual) {
      // Preencher será feito pelo select no useQuery
      return;
    }
    
    // Limpar formulário para novo prontuário
    setTimeout(() => {
      setValue('anamnese.motivoConsulta', '');
      setValue('anamnese.historiaDoenca', '');
      setValue('anamnese.antecedentesFamiliares', '');
      setValue('anamnese.habitos.fuma', false);
      setValue('anamnese.habitos.bebe', false);
      setValue('exame_fisico.pressaoArterial', '');
      setValue('exame_fisico.frequenciaCardiaca', '');
      setValue('exame_fisico.temperatura', '');
      setValue('exame_fisico.peso', '');
      setValue('exame_fisico.altura', '');
      setValue('exame_fisico.imc', '');
      setValue('exame_fisico.observacoes', '');
      setValue('diagnostico.principal', '');
      setValue('diagnostico.cid', '');
      setValue('prescricao.orientacoes', '');
      setValue('observacoes', '');
    }, 100);
  };

  const onSubmitProntuario = (dados: any) => {
    if (!consultaSelecionada || !pacienteSelecionado) {
      toast.error('Selecione uma consulta e paciente');
      return;
    }

    // Buscar ID do médico da consulta
    const medicoId = consultaSelecionada.medico?.id;
    if (!medicoId) {
      toast.error('Médico não encontrado na consulta');
      return;
    }

    const dadosProntuario = {
      paciente_id: pacienteSelecionado.id,
      medico_id: medicoId,
      consulta_id: consultaSelecionada.id,
      data_atendimento: consultaSelecionada.data,
      anamnese: {
        motivoConsulta: dados.anamnese?.motivoConsulta || '',
        historiaDoenca: dados.anamnese?.historiaDoenca || '',
        sintomas: dados.anamnese?.sintomas || [],
        medicamentosAtuais: dados.anamnese?.medicamentosAtuais || [],
        alergias: dados.anamnese?.alergias || [],
        antecedentesFamiliares: dados.anamnese?.antecedentesFamiliares || '',
        habitos: {
          fuma: dados.anamnese?.habitos?.fuma || false,
          bebe: dados.anamnese?.habitos?.bebe || false,
          exercicios: dados.anamnese?.habitos?.exercicios || '',
          alimentacao: dados.anamnese?.habitos?.alimentacao || ''
        }
      },
      exame_fisico: {
        pressaoArterial: dados.exame_fisico?.pressaoArterial || '',
        frequenciaCardiaca: dados.exame_fisico?.frequenciaCardiaca || '',
        temperatura: dados.exame_fisico?.temperatura || '',
        peso: dados.exame_fisico?.peso || '',
        altura: dados.exame_fisico?.altura || '',
        imc: dados.exame_fisico?.imc || '',
        observacoes: dados.exame_fisico?.observacoes || ''
      },
      diagnostico: {
        principal: dados.diagnostico?.principal || '',
        secundarios: dados.diagnostico?.secundarios || [],
        cid: dados.diagnostico?.cid || ''
      },
      prescricao: {
        medicamentos: dados.prescricao?.medicamentos || [],
        exames: dados.prescricao?.exames || [],
        orientacoes: dados.prescricao?.orientacoes || ''
      },
      observacoes: dados.observacoes || ''
    };

    if (prontuarioAtual?.id) {
      // Atualizar prontuário existente
      atualizarProntuarioMutation.mutate({
        id: prontuarioAtual.id,
        dados: dadosProntuario
      });
    } else {
      // Criar novo prontuário
      criarProntuarioMutation.mutate(dadosProntuario);
    }
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
            {!modoEdicao ? (
              <button
                onClick={handleNovoProntuario}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                disabled={!consultaSelecionada}
              >
                <Plus className="w-4 h-4" />
                <span>{prontuarioAtual ? 'Editar Prontuário' : 'Novo Prontuário'}</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => setModoEdicao(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitForm(onSubmitProntuario)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                  disabled={criarProntuarioMutation.isLoading || atualizarProntuarioMutation.isLoading}
                >
                  {criarProntuarioMutation.isLoading || atualizarProntuarioMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Salvar Prontuário</span>
                    </>
                  )}
                </button>
              </div>
            )}
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
                <form onSubmit={handleSubmitForm(onSubmitProntuario)} className="space-y-4">
                  {abaAtiva === 'anamnese' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Motivo da Consulta
                        </label>
                        {modoEdicao ? (
                          <textarea
                            {...registerForm('anamnese.motivoConsulta')}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Descreva o motivo da consulta..."
                            defaultValue={prontuarioAtual?.anamnese?.motivoConsulta || ''}
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[3rem]">
                            {prontuarioAtual?.anamnese?.motivoConsulta || 'Não informado'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          História da Doença Atual
                        </label>
                        {modoEdicao ? (
                          <textarea
                            {...registerForm('anamnese.historiaDoenca')}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            placeholder="Relato do paciente sobre a doença atual..."
                            defaultValue={prontuarioAtual?.anamnese?.historiaDoenca || ''}
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[4rem]">
                            {prontuarioAtual?.anamnese?.historiaDoenca || 'Não informado'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Antecedentes Familiares
                        </label>
                        {modoEdicao ? (
                          <textarea
                            {...registerForm('anamnese.antecedentesFamiliares')}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Histórico familiar relevante..."
                            defaultValue={prontuarioAtual?.anamnese?.antecedentesFamiliares || ''}
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[3rem]">
                            {prontuarioAtual?.anamnese?.antecedentesFamiliares || 'Não informado'}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fuma?
                          </label>
                          {modoEdicao ? (
                            <select
                              {...registerForm('anamnese.habitos.fuma')}
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              defaultValue={prontuarioAtual?.anamnese?.habitos?.fuma ? 'true' : 'false'}
                            >
                              <option value="false">Não</option>
                              <option value="true">Sim</option>
                            </select>
                          ) : (
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {prontuarioAtual?.anamnese?.habitos?.fuma ? 'Sim' : 'Não'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bebe?
                          </label>
                          {modoEdicao ? (
                            <select
                              {...registerForm('anamnese.habitos.bebe')}
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              defaultValue={prontuarioAtual?.anamnese?.habitos?.bebe ? 'true' : 'false'}
                            >
                              <option value="false">Não</option>
                              <option value="true">Sim</option>
                            </select>
                          ) : (
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {prontuarioAtual?.anamnese?.habitos?.bebe ? 'Sim' : 'Não'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {abaAtiva === 'exame' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pressão Arterial (mmHg)
                          </label>
                          {modoEdicao ? (
                            <input
                              {...registerForm('exame_fisico.pressaoArterial')}
                              type="text"
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ex: 120/80"
                              defaultValue={prontuarioAtual?.exame_fisico?.pressaoArterial || ''}
                            />
                          ) : (
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {prontuarioAtual?.exame_fisico?.pressaoArterial || 'Não informado'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frequência Cardíaca (bpm)
                          </label>
                          {modoEdicao ? (
                            <input
                              {...registerForm('exame_fisico.frequenciaCardiaca')}
                              type="number"
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ex: 72"
                              defaultValue={prontuarioAtual?.exame_fisico?.frequenciaCardiaca || ''}
                            />
                          ) : (
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {prontuarioAtual?.exame_fisico?.frequenciaCardiaca || 'Não informado'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Temperatura (°C)
                          </label>
                          {modoEdicao ? (
                            <input
                              {...registerForm('exame_fisico.temperatura')}
                              type="number"
                              step="0.1"
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ex: 36.5"
                              defaultValue={prontuarioAtual?.exame_fisico?.temperatura || ''}
                            />
                          ) : (
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {prontuarioAtual?.exame_fisico?.temperatura || 'Não informado'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            IMC
                          </label>
                          {modoEdicao ? (
                            <input
                              {...registerForm('exame_fisico.imc')}
                              type="number"
                              step="0.1"
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ex: 22.5"
                              defaultValue={prontuarioAtual?.exame_fisico?.imc || ''}
                            />
                          ) : (
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {prontuarioAtual?.exame_fisico?.imc || 'Não informado'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Peso (kg)
                          </label>
                          {modoEdicao ? (
                            <input
                              {...registerForm('exame_fisico.peso')}
                              type="number"
                              step="0.1"
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ex: 70.5"
                              defaultValue={prontuarioAtual?.exame_fisico?.peso || ''}
                            />
                          ) : (
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {prontuarioAtual?.exame_fisico?.peso ? `${prontuarioAtual.exame_fisico.peso} kg` : 'Não informado'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Altura (cm)
                          </label>
                          {modoEdicao ? (
                            <input
                              {...registerForm('exame_fisico.altura')}
                              type="number"
                              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ex: 170"
                              defaultValue={prontuarioAtual?.exame_fisico?.altura || ''}
                            />
                          ) : (
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {prontuarioAtual?.exame_fisico?.altura ? `${prontuarioAtual.exame_fisico.altura} cm` : 'Não informado'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Observações do Exame Físico
                        </label>
                        {modoEdicao ? (
                          <textarea
                            {...registerForm('exame_fisico.observacoes')}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            placeholder="Observações adicionais do exame físico..."
                            defaultValue={prontuarioAtual?.exame_fisico?.observacoes || ''}
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[4rem]">
                            {prontuarioAtual?.exame_fisico?.observacoes || 'Não informado'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {abaAtiva === 'diagnostico' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Diagnóstico Principal
                        </label>
                        {modoEdicao ? (
                          <textarea
                            {...registerForm('diagnostico.principal')}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            placeholder="Descrição do diagnóstico principal..."
                            defaultValue={prontuarioAtual?.diagnostico?.principal || ''}
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[4rem]">
                            {prontuarioAtual?.diagnostico?.principal || 'Não informado'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CID-10
                        </label>
                        {modoEdicao ? (
                          <input
                            {...registerForm('diagnostico.cid')}
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: I10 (Hipertensão essencial)"
                            defaultValue={prontuarioAtual?.diagnostico?.cid || ''}
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {prontuarioAtual?.diagnostico?.cid || 'Não informado'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {abaAtiva === 'prescricao' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Orientações e Prescrições
                        </label>
                        {modoEdicao ? (
                          <textarea
                            {...registerForm('prescricao.orientacoes')}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={10}
                            placeholder="Orientações, prescrições médicas, solicitação de exames, etc..."
                            defaultValue={prontuarioAtual?.prescricao?.orientacoes || ''}
                          />
                        ) : (
                          <div className="space-y-4">
                            {prontuarioAtual?.prescricao?.medicamentos?.length > 0 && (
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Medicamentos Prescritos:</h4>
                                {prontuarioAtual.prescricao.medicamentos.map((med: any, index: number) => (
                                  <div key={index} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                                    <p className="font-medium text-gray-900">{med.nome}</p>
                                    <p className="text-sm text-gray-600">
                                      {med.dosagem} - {med.frequencia} - {med.duracao}
                                    </p>
                                    {med.observacoes && (
                                      <p className="text-xs text-gray-500 mt-1">{med.observacoes}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {prontuarioAtual?.prescricao?.exames?.length > 0 && (
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Exames Solicitados:</h4>
                                {prontuarioAtual.prescricao.exames.map((exame: any, index: number) => (
                                  <div key={index} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                                    <p className="font-medium text-gray-900">{exame.tipo}</p>
                                    <p className="text-sm text-gray-600">{exame.descricao}</p>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                      {exame.urgencia}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className={`text-gray-900 bg-gray-50 p-3 rounded-lg ${!prontuarioAtual?.prescricao?.orientacoes ? 'min-h-[10rem]' : ''} whitespace-pre-wrap`}>
                              {prontuarioAtual?.prescricao?.orientacoes || 'Não informado'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {abaAtiva === 'evolucao' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Observações Gerais / Evolução
                        </label>
                        {modoEdicao ? (
                          <textarea
                            {...registerForm('observacoes')}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={10}
                            placeholder="Observações adicionais, evolução do paciente, etc..."
                            defaultValue={prontuarioAtual?.observacoes || ''}
                          />
                        ) : (
                          <>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg min-h-[10rem] whitespace-pre-wrap">
                              {prontuarioAtual?.observacoes || 'Não informado'}
                            </p>
                            {prontuarioAtual && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <p className="text-sm text-blue-800">
                                  <strong>Data de criação:</strong> {new Date(prontuarioAtual.created_at).toLocaleString('pt-BR')}
                                </p>
                                {prontuarioAtual.updated_at !== prontuarioAtual.created_at && (
                                  <p className="text-sm text-blue-800 mt-1">
                                    <strong>Última atualização:</strong> {new Date(prontuarioAtual.updated_at).toLocaleString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </form>
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
