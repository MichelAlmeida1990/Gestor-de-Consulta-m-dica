import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Calendar, Clock, User, Stethoscope, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { consultaService, medicoService, salaService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AgendamentoForm {
  medico_id: number;
  sala_id: number;
  data: string;
  horario: string;
  tipo_consulta: string;
  observacoes: string;
  urgencia: 'normal' | 'urgente' | 'emergencia';
}

const Agendamento: React.FC = () => {
  const { usuario } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AgendamentoForm>();

  // Buscar médicos disponíveis
  const { data: medicosData } = useQuery('medicos', () => medicoService.listar());
  const medicos = medicosData?.data || [];

  // Buscar salas disponíveis
  const { data: salasData } = useQuery('salas', () => salaService.listar());
  const salas = salasData?.data || [];

  // Buscar consultas existentes para verificar conflitos
  const { data: consultasData } = useQuery(
    'consultas-agendamento',
    () => consultaService.listar({ page: 1, limit: 100 })
  );
  const consultas = consultasData?.data?.consultas || [];

  // Gerar horários disponíveis
  const generateAvailableTimes = (medicoId: number, data: string) => {
    const horarios = [];
    const startHour = 8;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Verificar se o horário já está ocupado
        const isOccupied = consultas.some((consulta: any) => 
          consulta.medico.id === medicoId &&
          consulta.data === data &&
          consulta.horario === timeString &&
          consulta.status !== 'cancelada'
        );
        
        if (!isOccupied) {
          horarios.push(timeString);
        }
      }
    }
    
    setAvailableTimes(horarios);
  };

  // Mutação para criar agendamento
  const createAgendamentoMutation = useMutation(
    (data: any) => consultaService.criar(data),
    {
      onSuccess: () => {
        toast.success('Consulta agendada com sucesso!');
        queryClient.invalidateQueries('consultas-agendamento');
        queryClient.invalidateQueries('dashboard-consultas');
        // Reset form
        setValue('medico_id', 0);
        setValue('sala_id', 0);
        setValue('data', '');
        setValue('horario', '');
        setValue('tipo_consulta', '');
        setValue('observacoes', '');
        setValue('urgencia', 'normal');
        setSelectedDate('');
        setAvailableTimes([]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao agendar consulta');
      }
    }
  );

  const onSubmit = (data: AgendamentoForm) => {
    if (!usuario) {
      toast.error('Usuário não autenticado');
      return;
    }
    
    console.log('Dados do formulário:', data);
    console.log('Usuário:', usuario);
    
    const dadosEnvio = {
      ...data,
      medico_id: parseInt(data.medico_id.toString()),
      sala_id: parseInt(data.sala_id.toString()),
      paciente_id: parseInt(usuario.id.toString()),
      status: 'agendada'
    };
    
    console.log('Dados que serão enviados:', dadosEnvio);
    
    createAgendamentoMutation.mutate(dadosEnvio);
  };

  const watchedMedico = watch('medico_id');
  const watchedDate = watch('data');

  useEffect(() => {
    if (watchedMedico && watchedDate) {
      generateAvailableTimes(watchedMedico, watchedDate);
    }
  }, [watchedMedico, watchedDate]);

  // Gerar datas disponíveis (próximos 30 dias)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Não incluir fins de semana
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-azure-vivido rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agendamento de Consultas</h1>
            <p className="text-gray-600">Agende sua consulta de forma rápida e inteligente</p>
          </div>
        </div>
      </div>

      {/* Formulário de Agendamento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seleção de Médico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Stethoscope className="w-4 h-4 inline mr-2" />
                Médico
              </label>
              <select
                {...register('medico_id', { required: 'Selecione um médico' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
              >
                <option value={0}>Selecione um médico</option>
                {medicos.map((medico: any) => (
                  <option key={medico.id} value={medico.id}>
                    {medico.nome} - {medico.especialidade}
                  </option>
                ))}
              </select>
              {errors.medico_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.medico_id.message}
                </p>
              )}
            </div>

            {/* Seleção de Sala */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Sala
              </label>
              <select
                {...register('sala_id', { required: 'Selecione uma sala' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
              >
                <option value={0}>Selecione uma sala</option>
                {salas.map((sala: any) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome} - {sala.tipo}
                  </option>
                ))}
              </select>
              {errors.sala_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.sala_id.message}
                </p>
              )}
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data
              </label>
              <select
                {...register('data', { required: 'Selecione uma data' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
              >
                <option value="">Selecione uma data</option>
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </option>
                ))}
              </select>
              {errors.data && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.data.message}
                </p>
              )}
            </div>

            {/* Horário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Horário
              </label>
              <select
                {...register('horario', { required: 'Selecione um horário' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
                disabled={!watchedMedico || !watchedDate}
              >
                <option value="">Selecione um horário</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors.horario && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.horario.message}
                </p>
              )}
              {!watchedMedico || !watchedDate ? (
                <p className="mt-1 text-sm text-gray-500">
                  Selecione médico e data para ver horários disponíveis
                </p>
              ) : (
                <p className="mt-1 text-sm text-green-600">
                  {availableTimes.length} horários disponíveis
                </p>
              )}
            </div>

            {/* Tipo de Consulta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Consulta
              </label>
              <select
                {...register('tipo_consulta', { required: 'Selecione o tipo de consulta' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
              >
                <option value="">Selecione o tipo</option>
                <option value="consulta_rotina">Consulta de Rotina</option>
                <option value="consulta_especializada">Consulta Especializada</option>
                <option value="retorno">Retorno</option>
                <option value="emergencia">Emergência</option>
              </select>
              {errors.tipo_consulta && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.tipo_consulta.message}
                </p>
              )}
            </div>

            {/* Urgência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível de Urgência
              </label>
              <select
                {...register('urgencia')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
              >
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
                <option value="emergencia">Emergência</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              {...register('observacoes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure-vivido focus:border-transparent"
              placeholder="Descreva sintomas, histórico ou informações relevantes..."
            />
          </div>

          {/* Botão de Agendamento */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createAgendamentoMutation.isLoading}
              className="bg-verde-botao text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {createAgendamentoMutation.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Agendando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Agendar Consulta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Informações Importantes</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            <span>Horários disponíveis são atualizados em tempo real</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            <span>Consultas urgentes têm prioridade no agendamento</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            <span>Você receberá confirmação por email e SMS</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            <span>Cancelamentos devem ser feitos com 24h de antecedência</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Agendamento;
