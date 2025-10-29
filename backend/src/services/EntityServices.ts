import database from '../database/index';

export interface Medico {
  id: number;
  usuario_id: number;
  crm: string;
  especialidade: string;
  consultorio?: string;
  valor_consulta?: number;
  usuario?: {
    nome: string;
    email: string;
    telefone?: string;
  };
}

export interface Paciente {
  id: number;
  usuario_id: number;
  convenio?: string;
  alergias?: string;
  medicamentos_uso?: string;
  observacoes?: string;
  usuario?: {
    nome: string;
    email: string;
    telefone?: string;
    cpf?: string;
    data_nascimento?: string;
  };
}

export interface Consulta {
  id: number;
  paciente_id: number;
  medico_id: number;
  sala_id?: number;
  data: string;
  horario: string;
  tipo_consulta: string;
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada';
  urgencia: 'normal' | 'urgente' | 'emergencia';
  observacoes?: string;
  motivo_cancelamento?: string;
  valor?: number;
  created_at: string;
  updated_at: string;
  paciente?: Paciente;
  medico?: Medico;
  sala?: {
    id: number;
    nome: string;
    numero?: string;
  };
}

export interface Sala {
  id: number;
  nome: string;
  numero?: string;
  andar?: number;
  equipamentos?: string;
  capacidade: number;
  ativa: boolean;
  created_at: string;
}

export class MedicoService {
  static async listar(): Promise<Medico[]> {
    try {
      const medicos = await database.all(`
        SELECT m.*, u.nome, u.email, u.telefone 
        FROM medicos m 
        JOIN usuarios u ON m.usuario_id = u.id 
        WHERE u.ativo = 1
        ORDER BY u.nome
      `);
      return medicos;
    } catch (error) {
      console.error('Erro ao listar médicos:', error);
      throw error;
    }
  }

  static async buscarPorId(id: number): Promise<Medico | null> {
    try {
      const medico = await database.get(`
        SELECT m.*, u.nome, u.email, u.telefone 
        FROM medicos m 
        JOIN usuarios u ON m.usuario_id = u.id 
        WHERE m.id = ? AND u.ativo = 1
      `, [id]);
      return medico || null;
    } catch (error) {
      console.error('Erro ao buscar médico:', error);
      throw error;
    }
  }

  static async criar(dados: Partial<Medico>): Promise<Medico> {
    try {
      const result = await database.run(`
        INSERT INTO medicos (usuario_id, crm, especialidade, consultorio, valor_consulta)
        VALUES (?, ?, ?, ?, ?)
      `, [
        dados.usuario_id,
        dados.crm,
        dados.especialidade,
        dados.consultorio || null,
        dados.valor_consulta || null
      ]);

      const medico = await this.buscarPorId(result.lastID);
      return medico!;
    } catch (error) {
      console.error('Erro ao criar médico:', error);
      throw error;
    }
  }

  static async atualizar(id: number, dados: Partial<Medico>): Promise<Medico> {
    try {
      await database.run(`
        UPDATE medicos 
        SET crm = ?, especialidade = ?, consultorio = ?, valor_consulta = ?
        WHERE id = ?
      `, [
        dados.crm,
        dados.especialidade,
        dados.consultorio || null,
        dados.valor_consulta || null,
        id
      ]);

      const medico = await this.buscarPorId(id);
      return medico!;
    } catch (error) {
      console.error('Erro ao atualizar médico:', error);
      throw error;
    }
  }

  static async deletar(id: number): Promise<void> {
    try {
      await database.run('DELETE FROM medicos WHERE id = ?', [id]);
    } catch (error) {
      console.error('Erro ao deletar médico:', error);
      throw error;
    }
  }
}

export class PacienteService {
  static async listar(): Promise<Paciente[]> {
    try {
      const pacientes = await database.all(`
        SELECT p.*, u.nome, u.email, u.telefone, u.cpf, u.data_nascimento
        FROM pacientes p 
        JOIN usuarios u ON p.usuario_id = u.id 
        WHERE u.ativo = 1
        ORDER BY u.nome
      `);
      return pacientes;
    } catch (error) {
      console.error('Erro ao listar pacientes:', error);
      throw error;
    }
  }

  static async buscarPorId(id: number): Promise<Paciente | null> {
    try {
      const paciente = await database.get(`
        SELECT p.*, u.nome, u.email, u.telefone, u.cpf, u.data_nascimento
        FROM pacientes p 
        JOIN usuarios u ON p.usuario_id = u.id 
        WHERE p.id = ? AND u.ativo = 1
      `, [id]);
      return paciente || null;
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      throw error;
    }
  }

  static async criar(dados: Partial<Paciente>): Promise<Paciente> {
    try {
      const result = await database.run(`
        INSERT INTO pacientes (usuario_id, convenio, alergias, medicamentos_uso, observacoes)
        VALUES (?, ?, ?, ?, ?)
      `, [
        dados.usuario_id,
        dados.convenio || null,
        dados.alergias || null,
        dados.medicamentos_uso || null,
        dados.observacoes || null
      ]);

      const paciente = await this.buscarPorId(result.lastID);
      return paciente!;
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      throw error;
    }
  }

  static async atualizar(id: number, dados: Partial<Paciente>): Promise<Paciente> {
    try {
      await database.run(`
        UPDATE pacientes 
        SET convenio = ?, alergias = ?, medicamentos_uso = ?, observacoes = ?
        WHERE id = ?
      `, [
        dados.convenio || null,
        dados.alergias || null,
        dados.medicamentos_uso || null,
        dados.observacoes || null,
        id
      ]);

      const paciente = await this.buscarPorId(id);
      return paciente!;
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      throw error;
    }
  }
}

export class ConsultaService {
  static async listar(filtros: any = {}): Promise<Consulta[]> {
    try {
      let sql = `
        SELECT c.*, 
               p.usuario_id as paciente_usuario_id,
               u_p.nome as paciente_nome,
               u_p.email as paciente_email,
               u_p.telefone as paciente_telefone,
               m.usuario_id as medico_usuario_id,
               m.crm as medico_crm,
               m.especialidade as medico_especialidade,
               m.consultorio as medico_consultorio,
               m.valor_consulta as medico_valor_consulta,
               u_m.nome as medico_nome,
               u_m.email as medico_email,
               u_m.telefone as medico_telefone,
               s.nome as sala_nome,
               s.numero as sala_numero
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.id
        JOIN usuarios u_p ON p.usuario_id = u_p.id
        JOIN medicos m ON c.medico_id = m.id
        JOIN usuarios u_m ON m.usuario_id = u_m.id
        LEFT JOIN salas s ON c.sala_id = s.id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      // Aplicar filtros
      if (filtros.paciente_id) {
        sql += ' AND c.paciente_id = ?';
        params.push(filtros.paciente_id);
      }

      if (filtros.medico_id) {
        sql += ' AND c.medico_id = ?';
        params.push(filtros.medico_id);
      }

      if (filtros.status) {
        sql += ' AND c.status = ?';
        params.push(filtros.status);
      }

      if (filtros.data_inicio) {
        sql += ' AND c.data >= ?';
        params.push(filtros.data_inicio);
      }

      if (filtros.data_fim) {
        sql += ' AND c.data <= ?';
        params.push(filtros.data_fim);
      }

      sql += ' ORDER BY c.data, c.horario';

      const consultas = await database.all(sql, params);
      
      // Formatar dados
      return consultas.map(consulta => ({
        id: consulta.id,
        paciente_id: consulta.paciente_id,
        medico_id: consulta.medico_id,
        sala_id: consulta.sala_id,
        data: consulta.data,
        horario: consulta.horario,
        tipo_consulta: consulta.tipo_consulta,
        status: consulta.status,
        urgencia: consulta.urgencia,
        observacoes: consulta.observacoes,
        motivo_cancelamento: consulta.motivo_cancelamento,
        valor: consulta.valor,
        created_at: consulta.created_at,
        updated_at: consulta.updated_at,
        paciente: {
          id: consulta.paciente_id,
          usuario_id: consulta.paciente_usuario_id,
          usuario: {
            nome: consulta.paciente_nome,
            email: consulta.paciente_email,
            telefone: consulta.paciente_telefone
          }
        },
        medico: {
          id: consulta.medico_id,
          usuario_id: consulta.medico_usuario_id,
          crm: consulta.medico_crm || 'CRM-SP 000000',
          especialidade: consulta.medico_especialidade,
          consultorio: consulta.medico_consultorio || null,
          valor_consulta: consulta.medico_valor_consulta || null,
          usuario: {
            nome: consulta.medico_nome,
            email: consulta.medico_email,
            telefone: consulta.medico_telefone
          }
        },
        sala: consulta.sala_id ? {
          id: consulta.sala_id,
          nome: consulta.sala_nome,
          numero: consulta.sala_numero
        } : undefined
      }));
    } catch (error) {
      console.error('Erro ao listar consultas:', error);
      throw error;
    }
  }

  static async criar(dados: Partial<Consulta>): Promise<Consulta> {
    try {
      const result = await database.run(`
        INSERT INTO consultas (paciente_id, medico_id, sala_id, data, horario, tipo_consulta, status, urgencia, observacoes, valor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dados.paciente_id,
        dados.medico_id,
        dados.sala_id || null,
        dados.data,
        dados.horario,
        dados.tipo_consulta,
        dados.status || 'agendada',
        dados.urgencia || 'normal',
        dados.observacoes || null,
        dados.valor || null
      ]);

      const consultas = await this.listar({ id: result.lastID });
      return consultas[0];
    } catch (error) {
      console.error('Erro ao criar consulta:', error);
      throw error;
    }
  }

  static async confirmar(id: number): Promise<Consulta> {
    try {
      await database.run(`
        UPDATE consultas 
        SET status = 'confirmada', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'agendada'
      `, [id]);

      const consultas = await this.listar({ id });
      if (consultas.length === 0) {
        throw new Error('Consulta não encontrada ou não pode ser confirmada');
      }

      return consultas[0];
    } catch (error) {
      console.error('Erro ao confirmar consulta:', error);
      throw error;
    }
  }

  static async cancelar(id: number, motivo: string): Promise<Consulta> {
    try {
      await database.run(`
        UPDATE consultas 
        SET status = 'cancelada', motivo_cancelamento = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status IN ('agendada', 'confirmada')
      `, [motivo, id]);

      const consultas = await this.listar({ id });
      if (consultas.length === 0) {
        throw new Error('Consulta não encontrada ou não pode ser cancelada');
      }

      return consultas[0];
    } catch (error) {
      console.error('Erro ao cancelar consulta:', error);
      throw error;
    }
  }
}

export class SalaService {
  static async listar(): Promise<Sala[]> {
    try {
      const salas = await database.all(`
        SELECT * FROM salas 
        WHERE ativa = 1
        ORDER BY andar, numero
      `);
      return salas;
    } catch (error) {
      console.error('Erro ao listar salas:', error);
      throw error;
    }
  }

  static async buscarPorId(id: number): Promise<Sala | null> {
    try {
      const sala = await database.get(`
        SELECT * FROM salas 
        WHERE id = ? AND ativa = 1
      `, [id]);
      return sala || null;
    } catch (error) {
      console.error('Erro ao buscar sala:', error);
      throw error;
    }
  }

  static async criar(dados: Partial<Sala>): Promise<Sala> {
    try {
      const result = await database.run(`
        INSERT INTO salas (nome, numero, andar, equipamentos, capacidade)
        VALUES (?, ?, ?, ?, ?)
      `, [
        dados.nome,
        dados.numero || null,
        dados.andar || null,
        dados.equipamentos || null,
        dados.capacidade || 1
      ]);

      const sala = await this.buscarPorId(result.lastID);
      return sala!;
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      throw error;
    }
  }
}
