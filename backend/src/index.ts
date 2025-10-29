import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import database from './database/index';
import { AuthService, Usuario } from './services/AuthService';
import { MedicoService, PacienteService, ConsultaService, SalaService } from './services/EntityServices';

// Estender interface Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response): void => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'production',
    version: '2.0.0',
    message: 'Sistema funcionando com banco de dados real'
  });
});

// ==================== AUTENTICAÇÃO ====================

// Validar token e retornar dados do usuário
app.get('/api/auth/me', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        usuario: req.usuario
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Email e senha são obrigatórios',
          statusCode: 400
        }
      });
      return;
    }

    const resultado = await AuthService.login(email, senha);
    
    if (resultado.success) {
      res.json(resultado);
    } else {
      res.status(resultado.error?.statusCode || 500).json(resultado);
    }
  } catch (error) {
    console.error('Erro no endpoint de login:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Registro
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, email, senha, tipo, telefone, cpf, data_nascimento, endereco } = req.body;
    
    if (!nome || !email || !senha || !tipo) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Nome, email, senha e tipo são obrigatórios',
          statusCode: 400
        }
      });
      return;
    }

    const resultado = await AuthService.register({
      nome,
      email,
      senha,
      tipo,
      telefone,
      cpf,
      data_nascimento,
      endereco
    });
    
    if (resultado.success) {
      res.status(201).json(resultado);
    } else {
      res.status(resultado.error?.statusCode || 500).json(resultado);
    }
  } catch (error) {
    console.error('Erro no endpoint de registro:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// ==================== MÉDICOS ====================

// Listar médicos
app.get('/api/medicos', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Listando médicos...');
    
    // Buscar médicos com dados completos do usuário
    const medicos = await database.all(`
      SELECT 
        m.id,
        m.usuario_id,
        m.crm,
        m.especialidade,
        u.nome,
        u.email,
        u.telefone,
        u.ativo,
        u.created_at
      FROM medicos m 
      JOIN usuarios u ON m.usuario_id = u.id 
      ORDER BY u.nome
    `);
    
    // Formatar dados para o frontend
    const medicosFormatados = medicos.map((m: any) => ({
      id: m.id,
      nome: m.nome,
      email: m.email,
      telefone: m.telefone,
      crm: m.crm,
      especialidade: m.especialidade,
      ativo: m.ativo === 1 || m.ativo === true,
      created_at: m.created_at
    }));
    
    console.log(`✅ ${medicosFormatados.length} médicos encontrados`);
    
    res.json({
      success: true,
      data: medicosFormatados
    });
  } catch (error) {
    console.error('❌ Erro ao listar médicos:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Buscar médico por ID
app.get('/api/medicos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    const medicoRaw = await database.get(`
      SELECT 
        m.id,
        m.usuario_id,
        m.crm,
        m.especialidade,
        u.nome,
        u.email,
        u.telefone,
        u.ativo,
        u.created_at
      FROM medicos m 
      JOIN usuarios u ON m.usuario_id = u.id 
      WHERE m.id = ?
    `, [id]);
    
    if (!medicoRaw) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Médico não encontrado',
          statusCode: 404
        }
      });
      return;
    }

    // Formatar dados para o frontend
    const medico = {
      id: medicoRaw.id,
      nome: medicoRaw.nome,
      email: medicoRaw.email,
      telefone: medicoRaw.telefone,
      crm: medicoRaw.crm,
      especialidade: medicoRaw.especialidade,
      ativo: medicoRaw.ativo === 1 || medicoRaw.ativo === true,
      created_at: medicoRaw.created_at
    };

    res.json({
      success: true,
      data: medico
    });
  } catch (error) {
    console.error('Erro ao buscar médico:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Criar médico - COM VERIFICAÇÃO MANUAL DE ADMIN
app.post('/api/medicos', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Requisição para criar médico recebida');
    console.log('📋 Dados recebidos:', req.body);
    
    // Verificação manual de admin (sem middleware)
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      console.log('❌ Token não fornecido');
      res.status(401).json({
        success: false,
        error: {
          message: 'Token não fornecido',
          statusCode: 401
        }
      });
      return;
    }
    
    try {
      const decoded = AuthService.verifyToken(token) as any;
      console.log('✅ Token decodificado:', { id: decoded.id, email: decoded.email, tipo: decoded.tipo });
      
      if (decoded.tipo !== 'admin') {
        console.log('❌ Usuário não é admin:', decoded.tipo);
        res.status(403).json({
          success: false,
          error: {
            message: 'Apenas administradores podem cadastrar médicos',
            statusCode: 403
          }
        });
        return;
      }
    } catch (tokenError) {
      console.log('❌ Token inválido:', tokenError);
      res.status(401).json({
        success: false,
        error: {
          message: 'Token inválido',
          statusCode: 401
        }
      });
      return;
    }

    const { nome, email, telefone, crm, especialidade, ativo } = req.body;
    
    if (!nome || !email || !crm || !especialidade) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Nome, email, CRM e especialidade são obrigatórios',
          statusCode: 400
        }
      });
      return;
    }

    // Verificar se email já existe
    const usuarioExistente = await database.get(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (usuarioExistente) {
      res.status(409).json({
        success: false,
        error: {
          message: 'Email já está em uso',
          statusCode: 409
        }
      });
      return;
    }

    // Verificar se CRM já existe
    const crmExistente = await database.get(
      'SELECT id FROM medicos WHERE crm = ?',
      [crm]
    );

    if (crmExistente) {
      res.status(409).json({
        success: false,
        error: {
          message: 'CRM já está em uso',
          statusCode: 409
        }
      });
      return;
    }

    // Criar usuário primeiro
    const senhaPadrao = '123456'; // Senha padrão para médicos
    const senhaHash = await AuthService.hashPassword(senhaPadrao);
    
    const usuarioResult = await database.run(`
      INSERT INTO usuarios (nome, email, senha, tipo, telefone, ativo)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nome, email, senhaHash, 'medico', telefone, ativo !== false]);

    const usuarioId = usuarioResult.lastID;

    // Criar médico
    const medicoResult = await database.run(`
      INSERT INTO medicos (usuario_id, crm, especialidade)
      VALUES (?, ?, ?)
    `, [usuarioId, crm, especialidade]);

    // Buscar médico criado com dados do usuário
    const medicoRaw = await database.get(`
      SELECT 
        m.id,
        m.usuario_id,
        m.crm,
        m.especialidade,
        u.nome,
        u.email,
        u.telefone,
        u.ativo,
        u.created_at
      FROM medicos m 
      JOIN usuarios u ON m.usuario_id = u.id 
      WHERE m.id = ?
    `, [medicoResult.lastID]);

    // Formatar dados para o frontend
    const medico = {
      id: medicoRaw.id,
      nome: medicoRaw.nome,
      email: medicoRaw.email,
      telefone: medicoRaw.telefone,
      crm: medicoRaw.crm,
      especialidade: medicoRaw.especialidade,
      ativo: medicoRaw.ativo === 1 || medicoRaw.ativo === true,
      created_at: medicoRaw.created_at
    };

    console.log('✅ Médico criado com sucesso:', medico);

    res.status(201).json({
      success: true,
      data: medico,
      message: 'Médico criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar médico:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Atualizar médico - COM VERIFICAÇÃO MANUAL DE ADMIN
app.put('/api/medicos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de admin (sem middleware)
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Token não fornecido', statusCode: 401 }
      });
      return;
    }
    
    try {
      const decoded = AuthService.verifyToken(token) as any;
      if (decoded.tipo !== 'admin') {
        res.status(403).json({
          success: false,
          error: { message: 'Apenas administradores podem atualizar médicos', statusCode: 403 }
        });
        return;
      }
    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: { message: 'Token inválido', statusCode: 401 }
      });
      return;
    }

    const id = parseInt(req.params.id);
    const { nome, email, telefone, crm, especialidade, ativo } = req.body;
    
    if (!nome || !email || !crm || !especialidade) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Nome, email, CRM e especialidade são obrigatórios',
          statusCode: 400
        }
      });
      return;
    }

    // Buscar médico existente
    const medicoExistente = await database.get(`
      SELECT m.*, u.nome, u.email, u.telefone 
      FROM medicos m 
      JOIN usuarios u ON m.usuario_id = u.id 
      WHERE m.id = ?
    `, [id]);

    if (!medicoExistente) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Médico não encontrado',
          statusCode: 404
        }
      });
      return;
    }

    // Verificar se email já existe em outro usuário
    const usuarioExistente = await database.get(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [email, medicoExistente.usuario_id]
    );

    if (usuarioExistente) {
      res.status(409).json({
        success: false,
        error: {
          message: 'Email já está em uso por outro usuário',
          statusCode: 409
        }
      });
      return;
    }

    // Verificar se CRM já existe em outro médico
    const crmExistente = await database.get(
      'SELECT id FROM medicos WHERE crm = ? AND id != ?',
      [crm, id]
    );

    if (crmExistente) {
      res.status(409).json({
        success: false,
        error: {
          message: 'CRM já está em uso por outro médico',
          statusCode: 409
        }
      });
      return;
    }

    // Atualizar usuário
    await database.run(`
      UPDATE usuarios 
      SET nome = ?, email = ?, telefone = ?, ativo = ?
      WHERE id = ?
    `, [nome, email, telefone, ativo !== false, medicoExistente.usuario_id]);

    // Atualizar médico
    await database.run(`
      UPDATE medicos 
      SET crm = ?, especialidade = ?
      WHERE id = ?
    `, [crm, especialidade, id]);

    // Buscar médico atualizado
    const medicoRaw = await database.get(`
      SELECT 
        m.id,
        m.usuario_id,
        m.crm,
        m.especialidade,
        u.nome,
        u.email,
        u.telefone,
        u.ativo,
        u.created_at
      FROM medicos m 
      JOIN usuarios u ON m.usuario_id = u.id 
      WHERE m.id = ?
    `, [id]);

    // Formatar dados para o frontend
    const medico = {
      id: medicoRaw.id,
      nome: medicoRaw.nome,
      email: medicoRaw.email,
      telefone: medicoRaw.telefone,
      crm: medicoRaw.crm,
      especialidade: medicoRaw.especialidade,
      ativo: medicoRaw.ativo === 1 || medicoRaw.ativo === true,
      created_at: medicoRaw.created_at
    };

    console.log('✅ Médico atualizado com sucesso:', medico);

    res.json({
      success: true,
      data: medico,
      message: 'Médico atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar médico:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Deletar médico - COM VERIFICAÇÃO MANUAL DE ADMIN
app.delete('/api/medicos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de admin (sem middleware)
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Token não fornecido', statusCode: 401 }
      });
      return;
    }
    
    try {
      const decoded = AuthService.verifyToken(token) as any;
      if (decoded.tipo !== 'admin') {
        res.status(403).json({
          success: false,
          error: { message: 'Apenas administradores podem remover médicos', statusCode: 403 }
        });
        return;
      }
    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: { message: 'Token inválido', statusCode: 401 }
      });
      return;
    }

    const id = parseInt(req.params.id);
    
    // Buscar médico existente
    const medicoExistente = await database.get(`
      SELECT m.*, u.nome, u.email, u.telefone 
      FROM medicos m 
      JOIN usuarios u ON m.usuario_id = u.id 
      WHERE m.id = ?
    `, [id]);

    if (!medicoExistente) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Médico não encontrado',
          statusCode: 404
        }
      });
      return;
    }

    // Deletar médico (cascade deletará o usuário também)
    await database.run('DELETE FROM medicos WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Médico removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar médico:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Alterar status do médico - COM VERIFICAÇÃO MANUAL DE ADMIN
app.put('/api/medicos/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de admin (sem middleware)
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Token não fornecido', statusCode: 401 }
      });
      return;
    }
    
    try {
      const decoded = AuthService.verifyToken(token) as any;
      if (decoded.tipo !== 'admin') {
        res.status(403).json({
          success: false,
          error: { message: 'Apenas administradores podem alterar o status de médicos', statusCode: 403 }
        });
        return;
      }
    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: { message: 'Token inválido', statusCode: 401 }
      });
      return;
    }

    const id = parseInt(req.params.id);
    const { ativo } = req.body;
    
    // Buscar médico existente
    const medicoExistente = await database.get(`
      SELECT m.*, u.nome, u.email, u.telefone 
      FROM medicos m 
      JOIN usuarios u ON m.usuario_id = u.id 
      WHERE m.id = ?
    `, [id]);

    if (!medicoExistente) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Médico não encontrado',
          statusCode: 404
        }
      });
      return;
    }

    // Atualizar status do usuário
    await database.run(`
      UPDATE usuarios 
      SET ativo = ?
      WHERE id = ?
    `, [ativo, medicoExistente.usuario_id]);

    res.json({
      success: true,
      message: 'Status do médico alterado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar status do médico:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// ==================== PACIENTES ====================

// Listar pacientes - COM VERIFICAÇÃO MANUAL DE TOKEN
app.get('/api/pacientes', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token (sem middleware)
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Token não fornecido', statusCode: 401 }
      });
      return;
    }
    
    try {
      AuthService.verifyToken(token);
    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: { message: 'Token inválido', statusCode: 401 }
      });
      return;
    }
    
    console.log('📋 Listando pacientes...');
    const pacientes = await PacienteService.listar();
    console.log(`✅ ${pacientes.length} pacientes encontrados`);
    
    // Formatar dados para o frontend
    const pacientesFormatados = pacientes.map((p: any) => ({
      id: p.id,
      usuario_id: p.usuario_id,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone || null,
      cpf: p.cpf || null,
      dataNascimento: p.data_nascimento || null,
      endereco: null,
      usuario: {
        nome: p.nome,
        email: p.email,
        telefone: p.telefone || null
      }
    }));
    
    res.json({
      success: true,
      data: pacientesFormatados
    });
  } catch (error) {
    console.error('❌ Erro ao listar pacientes:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Buscar paciente por ID
app.get('/api/pacientes/:id', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const paciente = await PacienteService.buscarPorId(id);
    
    if (!paciente) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Paciente não encontrado',
          statusCode: 404
        }
      });
      return;
    }

    res.json({
      success: true,
      data: paciente
    });
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// ==================== CONSULTAS ====================

// Listar consultas
app.get('/api/consultas', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token (sem middleware)
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Token não fornecido', statusCode: 401 }
      });
      return;
    }
    
    let decoded: any;
    try {
      decoded = AuthService.verifyToken(token);
    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: { message: 'Token inválido', statusCode: 401 }
      });
      return;
    }
    
    // Buscar usuário do token
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    const { paciente_id, medico_id, status, data_inicio, data_fim, busca } = req.query;
    
    const filtros: any = {};
    
    // Aplicar filtros baseados no tipo de usuário
    if (usuario.tipo === 'paciente') {
      // Pacientes só veem suas próprias consultas
      const paciente = await database.get(
        'SELECT id FROM pacientes WHERE usuario_id = ?',
        [usuario.id]
      );
      if (paciente) {
        filtros.paciente_id = paciente.id;
      }
    } else if (usuario.tipo === 'medico') {
      // Médicos só veem suas próprias consultas
      const medico = await database.get(
        'SELECT id FROM medicos WHERE usuario_id = ?',
        [usuario.id]
      );
      if (medico) {
        filtros.medico_id = medico.id;
      }
    }
    // Admin vê todas as consultas (sem filtro adicional)

    // Aplicar filtros adicionais
    if (paciente_id) filtros.paciente_id = paciente_id;
    if (medico_id) filtros.medico_id = medico_id;
    if (status) filtros.status = status;
    if (data_inicio) filtros.data_inicio = data_inicio;
    if (data_fim) filtros.data_fim = data_fim;

    console.log('📋 Buscando consultas com filtros:', filtros);
    console.log('👤 Tipo de usuário:', usuario.tipo);
    console.log('👤 Usuário ID:', usuario.id);
    
    const consultas = await ConsultaService.listar(filtros);
    
    console.log(`✅ ${consultas.length} consultas encontradas`);
    console.log('📝 IDs das consultas encontradas:', consultas.map((c: any) => c.id).join(', '));
    
    res.json({
      success: true,
      data: {
        consultas,
        pagination: {
          page: 1,
          limit: 50,
          total: consultas.length,
          totalPages: Math.ceil(consultas.length / 50)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar consultas:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Criar consulta
app.post('/api/consultas', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token (sem middleware)
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Token não fornecido', statusCode: 401 }
      });
      return;
    }
    
    let decoded: any;
    try {
      decoded = AuthService.verifyToken(token);
    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: { message: 'Token inválido', statusCode: 401 }
      });
      return;
    }
    
    // Buscar usuário do token
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    const { medico_id, sala_id, data, horario, tipo_consulta, observacoes, urgencia, paciente_id } = req.body;
    
    if (!medico_id || !data || !horario || !tipo_consulta) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Médico, data, horário e tipo de consulta são obrigatórios',
          statusCode: 400
        }
      });
      return;
    }

    // Se não foi fornecido paciente_id, usar o ID do usuário logado
    let pacienteId = paciente_id;
    console.log('🔍 paciente_id recebido:', pacienteId);
    console.log('🔍 tipo do usuário:', usuario.tipo);
    
    if (!pacienteId && usuario.tipo === 'paciente') {
      console.log('🔍 Buscando paciente para usuario_id:', usuario.id);
      const paciente = await database.get(
        'SELECT id FROM pacientes WHERE usuario_id = ?',
        [usuario.id]
      );
      if (paciente) {
        pacienteId = paciente.id;
        console.log('✅ Paciente encontrado com ID:', pacienteId);
      } else {
        console.log('❌ Paciente não encontrado para usuario_id:', usuario.id);
      }
    } else if (pacienteId && usuario.tipo === 'admin') {
      // Se admin está criando para outro paciente, verificar se o ID é válido
      // Primeiro verificar se já é um ID de paciente válido
      const pacienteDireto = await database.get(
        'SELECT id FROM pacientes WHERE id = ?',
        [pacienteId]
      );
      
      // Se não encontrou, pode ser que seja um usuario_id - buscar o paciente correspondente
      if (!pacienteDireto) {
        console.log('⚠️ paciente_id não encontrado, tentando como usuario_id...');
        const pacientePorUsuario = await database.get(
          'SELECT id FROM pacientes WHERE usuario_id = ?',
          [pacienteId]
        );
        if (pacientePorUsuario) {
          pacienteId = pacientePorUsuario.id;
          console.log('✅ Corrigido: usando paciente_id =', pacienteId);
        }
      }
    }

    if (!pacienteId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'ID do paciente é obrigatório',
          statusCode: 400
        }
      });
      return;
    }
    
    console.log('✅ Usando paciente_id final:', pacienteId);

    // Verificar conflito de horário
    const conflito = await database.get(`
      SELECT id FROM consultas 
      WHERE medico_id = ? AND data = ? AND horario = ? AND status NOT IN ('cancelada', 'realizada')
    `, [medico_id, data, horario]);

    if (conflito) {
      res.status(409).json({
        success: false,
        error: {
          message: 'Horário já ocupado para este médico',
          statusCode: 409
        }
      });
      return;
    }

    console.log('📝 Criando consulta com dados:', {
      paciente_id: pacienteId,
      medico_id,
      sala_id,
      data,
      horario,
      tipo_consulta
    });

    const consulta = await ConsultaService.criar({
      paciente_id: pacienteId,
      medico_id,
      sala_id,
      data,
      horario,
      tipo_consulta,
      observacoes,
      urgencia
    });

    console.log('✅ Consulta criada com sucesso - ID:', consulta.id);

    res.status(201).json({
      success: true,
      data: consulta,
      message: 'Consulta agendada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar consulta:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Confirmar consulta
app.post('/api/consultas/:id/confirmar', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const consulta = await ConsultaService.confirmar(id);
    
    res.json({
      success: true,
      data: consulta,
      message: 'Consulta confirmada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao confirmar consulta:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    res.status(500).json({
      success: false,
      error: {
        message: errorMessage,
        statusCode: 500
      }
    });
  }
});

// Cancelar consulta
app.post('/api/consultas/:id/cancelar', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    
    if (!motivo) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Motivo do cancelamento é obrigatório',
          statusCode: 400
        }
      });
      return;
    }

    const consulta = await ConsultaService.cancelar(id, motivo);
    
    res.json({
      success: true,
      data: consulta,
      message: 'Consulta cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar consulta:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    res.status(500).json({
      success: false,
      error: {
        message: errorMessage,
        statusCode: 500
      }
    });
  }
});

// ==================== SALAS ====================

// Listar salas
// Listar salas - SEM AUTENTICAÇÃO (necessário para agendamento)
app.get('/api/salas', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Listando salas...');
    
    const salas = await database.all(`
      SELECT * FROM salas 
      WHERE ativa = 1 
      ORDER BY nome
    `);
    
    console.log(`✅ ${salas.length} salas encontradas`);
    
    res.json({
      success: true,
      data: salas
    });
  } catch (error) {
    console.error('❌ Erro ao listar salas:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// ==================== NOTIFICAÇÕES ====================

// Listar notificações
app.get('/api/notificacoes', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const notificacoes = await database.all(`
      SELECT * FROM notificacoes 
      WHERE usuario_id = ? 
      ORDER BY created_at DESC
    `, [req.usuario?.id]);

    res.json({
      success: true,
      data: notificacoes
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Marcar notificação como lida
app.patch('/api/notificacoes/:id/lida', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    await database.run(`
      UPDATE notificacoes 
      SET lida = 1 
      WHERE id = ? AND usuario_id = ?
    `, [id, req.usuario?.id]);

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Contar notificações não lidas
app.get('/api/notificacoes/nao-lidas', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await database.get(`
      SELECT COUNT(*) as count FROM notificacoes 
      WHERE usuario_id = ? AND lida = 0
    `, [req.usuario?.id]);

  res.json({
      success: true,
      data: { count: count.count }
    });
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Middleware de tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Erro interno do servidor',
      statusCode: 500
    }
  });
});

// Middleware para rotas não encontradas
app.use('*', (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Rota não encontrada',
      statusCode: 404
    }
  });
});

// Inicializar servidor
async function startServer(): Promise<void> {
  try {
    // Conectar ao banco de dados
    await database.connect();
    await database.initialize();

// Iniciar servidor
app.listen(PORT, () => {
      console.log('🚀 Servidor rodando na porta', PORT);
      console.log('📚 Ambiente: production (banco de dados real)');
      console.log('🔗 URL: http://localhost:' + PORT);
      console.log('💚 Health Check: http://localhost:' + PORT + '/api/health');
      console.log('🔐 Login: http://localhost:' + PORT + '/api/auth/login');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido SIGINT. Fechando servidor...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido SIGTERM. Fechando servidor...');
  await database.close();
  process.exit(0);
});

startServer();