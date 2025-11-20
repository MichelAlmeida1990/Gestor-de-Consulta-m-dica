import dotenv from 'dotenv';
dotenv.config();

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

// Middleware CORS - Configurar ANTES de qualquer outro middleware
// Permitir todas as origens em desenvolvimento
app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permitir requisições sem origin (Postman, mobile apps, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Permitir localhost em qualquer porta
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    // Permitir origens específicas
    const allowedOrigins = [
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Em desenvolvimento, permitir todas as origens
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 horas
}));

// Handler explícito para requisições OPTIONS (preflight)
app.options('*', cors());

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

    const { nome, email, telefone, crm, especialidade, ativo, senha } = req.body;
    
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
    // Se senha não fornecida, usar senha padrão, senão usar a senha fornecida
    let senhaFinal = '123456'; // Senha padrão
    
    if (senha && typeof senha === 'string' && senha.trim().length > 0) {
      senhaFinal = senha.trim();
      console.log('🔐 Senha fornecida pelo admin');
    } else {
      console.log('🔐 Usando senha padrão (123456)');
    }
    
    // Validar senha (mínimo 6 caracteres)
    if (senhaFinal.length < 6) {
      console.log('❌ Senha inválida:', senhaFinal.length, 'caracteres');
      res.status(400).json({
        success: false,
        error: {
          message: 'Senha deve ter no mínimo 6 caracteres',
          statusCode: 400
        }
      });
      return;
    }
    
    console.log('🔐 Criando médico com senha:', senha ? 'Senha fornecida' : 'Senha padrão (123456)');
    
    let senhaHash;
    try {
      senhaHash = await AuthService.hashPassword(senhaFinal);
      console.log('✅ Senha hash gerada com sucesso');
    } catch (hashError) {
      console.error('❌ Erro ao gerar hash da senha:', hashError);
      res.status(500).json({
        success: false,
        error: {
          message: 'Erro ao processar senha',
          statusCode: 500
        }
      });
      return;
    }
    
    let usuarioResult;
    try {
      console.log('📝 Criando usuário para o médico...');
      usuarioResult = await database.run(`
        INSERT INTO usuarios (nome, email, senha, tipo, telefone, ativo)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [nome, email, senhaHash, 'medico', telefone || null, ativo !== false]);
      console.log('✅ Usuário criado com ID:', usuarioResult.lastID);
    } catch (dbError) {
      console.error('❌ Erro ao criar usuário:', dbError);
      res.status(500).json({
        success: false,
        error: {
          message: 'Erro ao criar usuário do médico',
          statusCode: 500
        }
      });
      return;
    }

    const usuarioId = usuarioResult.lastID;

    // Criar médico
    let medicoResult;
    try {
      console.log('📝 Criando registro de médico...');
      medicoResult = await database.run(`
        INSERT INTO medicos (usuario_id, crm, especialidade)
        VALUES (?, ?, ?)
      `, [usuarioId, crm, especialidade]);
      console.log('✅ Médico criado com ID:', medicoResult.lastID);
    } catch (dbError) {
      console.error('❌ Erro ao criar médico:', dbError);
      // Se falhar ao criar médico, tentar remover o usuário criado
      try {
        await database.run('DELETE FROM usuarios WHERE id = ?', [usuarioId]);
        console.log('✅ Usuário removido após erro na criação do médico');
      } catch (cleanupError) {
        console.error('❌ Erro ao remover usuário após falha:', cleanupError);
      }
      res.status(500).json({
        success: false,
        error: {
          message: 'Erro ao criar registro de médico',
          statusCode: 500
        }
      });
      return;
    }

    // Buscar médico criado com dados do usuário
    let medicoRaw;
    try {
      medicoRaw = await database.get(`
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
      
      if (!medicoRaw) {
        console.log('⚠️ Médico criado mas não encontrado na busca');
      } else {
        console.log('✅ Médico encontrado:', medicoRaw.id);
      }
    } catch (dbError) {
      console.error('❌ Erro ao buscar médico criado:', dbError);
      // Mesmo assim retornar sucesso, pois o médico foi criado
      medicoRaw = null;
    }

    // Formatar dados para o frontend
    let medico;
    
    if (medicoRaw) {
      // Formatar dados do médico encontrado
      medico = {
        id: medicoRaw.id,
        nome: medicoRaw.nome,
        email: medicoRaw.email,
        telefone: medicoRaw.telefone,
        crm: medicoRaw.crm,
        especialidade: medicoRaw.especialidade,
        ativo: medicoRaw.ativo === 1 || medicoRaw.ativo === true,
        created_at: medicoRaw.created_at
      };
      console.log('✅ Médico criado com sucesso:', medico.id);
    } else {
      // Médico foi criado mas não foi encontrado na busca - retornar dados básicos
      console.log('⚠️ Retornando dados básicos do médico criado');
      medico = {
        id: medicoResult.lastID,
        nome: nome,
        email: email,
        telefone: telefone || null,
        crm: crm,
        especialidade: especialidade,
        ativo: ativo !== false,
        created_at: new Date().toISOString()
      };
      console.log('✅ Médico criado (dados básicos):', medico.id);
    }

    res.status(201).json({
      success: true,
      data: medico,
      message: 'Médico cadastrado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar médico:', error);
    if (error instanceof Error) {
      console.error('❌ Mensagem de erro:', error.message);
      console.error('❌ Stack trace:', error.stack);
    }
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
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
app.get('/api/consultas', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Endpoint /api/consultas chamado');
    console.log('👤 Usuário autenticado:', req.usuario ? 'Sim' : 'Não');
    
    if (!req.usuario) {
      console.log('❌ req.usuario não está definido!');
      res.status(401).json({
        success: false,
        error: {
          message: 'Usuário não autenticado',
          statusCode: 401
        }
      });
      return;
    }
    
    const usuario = req.usuario;
    console.log('👤 Usuário:', { id: usuario.id, email: usuario.email, tipo: usuario.tipo });
    
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
        console.log('✅ Paciente encontrado - ID:', paciente.id);
      } else {
        console.log('❌ Paciente não encontrado para usuario_id:', usuario.id);
        // Se não encontrou paciente, criar um registro para o usuário
        try {
          const result = await database.run(
            'INSERT INTO pacientes (usuario_id) VALUES (?)',
            [usuario.id]
          );
          filtros.paciente_id = result.lastID;
          console.log('✅ Registro de paciente criado automaticamente - ID:', result.lastID);
        } catch (err) {
          console.error('❌ Erro ao criar registro de paciente:', err);
        }
      }
    } else if (usuario.tipo === 'medico') {
      // Médicos só veem suas próprias consultas
      const medico = await database.get(
        'SELECT id FROM medicos WHERE usuario_id = ?',
        [usuario.id]
      );
      if (medico) {
        filtros.medico_id = medico.id;
        console.log('✅ Médico encontrado - ID:', medico.id);
      } else {
        console.log('❌ Médico não encontrado para usuario_id:', usuario.id);
      }
    }
    // Admin vê todas as consultas (sem filtro adicional)

    // Aplicar filtros adicionais (sobrescrever se fornecidos)
    if (paciente_id) {
      filtros.paciente_id = parseInt(paciente_id as string);
      console.log('📋 Filtro paciente_id fornecido:', filtros.paciente_id);
    }
    if (medico_id) {
      filtros.medico_id = parseInt(medico_id as string);
      console.log('📋 Filtro medico_id fornecido:', filtros.medico_id);
    }
    if (status) filtros.status = status;
    if (data_inicio) filtros.data_inicio = data_inicio;
    if (data_fim) filtros.data_fim = data_fim;

    console.log('📋 Buscando consultas com filtros:', filtros);
    console.log('👤 Tipo de usuário:', usuario.tipo);
    console.log('👤 Usuário ID:', usuario.id);

    const consultas = await ConsultaService.listar(filtros);
    
    console.log(`✅ ${consultas.length} consultas encontradas`);
    if (consultas.length > 0) {
      console.log('📝 IDs das consultas encontradas:', consultas.map((c: any) => c.id).join(', '));
      console.log('📝 Primeira consulta:', {
        id: consultas[0].id,
        paciente_id: consultas[0].paciente_id,
        paciente_usuario_id: consultas[0].paciente?.usuario_id
      });
    } else {
      console.log('⚠️ Nenhuma consulta encontrada com os filtros aplicados');
      console.log('🔍 Filtros aplicados:', filtros);
      
      // Debug: verificar se há consultas sem filtro
      const todasConsultas = await ConsultaService.listar({});
      console.log(`🔍 Total de consultas no banco (sem filtro): ${todasConsultas.length}`);
      if (todasConsultas.length > 0) {
        console.log('🔍 Primeira consulta (sem filtro):', {
          id: todasConsultas[0].id,
          paciente_id: todasConsultas[0].paciente_id,
          paciente_usuario_id: todasConsultas[0].paciente?.usuario_id
        });
      }
    }
    
    // Log da resposta final
    console.log('📤 Enviando resposta:', {
      success: true,
      consultas_count: consultas.length,
      primeiro_id: consultas.length > 0 ? consultas[0].id : null
    });
    
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
      let paciente = await database.get(
        'SELECT id FROM pacientes WHERE usuario_id = ?',
        [usuario.id]
      );
      if (paciente) {
        pacienteId = paciente.id;
        console.log('✅ Paciente encontrado com ID:', pacienteId);
      } else {
        console.log('❌ Paciente não encontrado para usuario_id:', usuario.id);
        // Criar registro de paciente automaticamente se não existir
        try {
          const result = await database.run(
            'INSERT INTO pacientes (usuario_id) VALUES (?)',
            [usuario.id]
          );
          pacienteId = result.lastID;
          console.log('✅ Registro de paciente criado automaticamente - ID:', pacienteId);
        } catch (err) {
          console.error('❌ Erro ao criar registro de paciente:', err);
          res.status(400).json({
            success: false,
            error: {
              message: 'Erro ao criar registro de paciente. Entre em contato com o suporte.',
              statusCode: 400
            }
          });
          return;
        }
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

    // Criar notificações para paciente e médico
    try {
      // Buscar detalhes completos da consulta
      const consultaDetalhes = await ConsultaService.listar({ id: consulta.id });
      if (consultaDetalhes.length > 0) {
        const consultaCompleta = consultaDetalhes[0];
        
        // Notificação para o paciente
        if (consultaCompleta.paciente?.usuario_id) {
          await database.run(`
            INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
            VALUES (?, ?, ?, ?)
          `, [
            consultaCompleta.paciente.usuario_id,
            'Nova Consulta Agendada',
            `Sua consulta com ${consultaCompleta.medico?.usuario?.nome || 'o médico'} foi agendada para ${consultaCompleta.data} às ${consultaCompleta.horario}.`,
            'info'
          ]);
        }
        
        // Notificação para o médico
        if (consultaCompleta.medico?.usuario_id) {
          await database.run(`
            INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
            VALUES (?, ?, ?, ?)
          `, [
            consultaCompleta.medico.usuario_id,
            'Nova Consulta Agendada',
            `Uma nova consulta com ${consultaCompleta.paciente?.usuario?.nome || 'o paciente'} foi agendada para ${consultaCompleta.data} às ${consultaCompleta.horario}.`,
            'info'
          ]);
        }
      }
    } catch (notifError) {
      console.error('⚠️ Erro ao criar notificações de agendamento:', notifError);
      // Não falhar a requisição se a notificação falhar
    }

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
app.put('/api/consultas/:id/confirmar', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    const id = parseInt(req.params.id);
    
    // Buscar consulta para verificar permissões
    const consultas = await ConsultaService.listar({ id });
    if (consultas.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Consulta não encontrada',
          statusCode: 404
        }
      });
      return;
    }
    
    const consulta = consultas[0];
    
    // Verificar permissões: paciente, médico ou admin podem confirmar
    let temPermissao = false;
    
    if (usuario.tipo === 'admin') {
      temPermissao = true;
    } else if (usuario.tipo === 'paciente') {
      const paciente = await database.get('SELECT id FROM pacientes WHERE usuario_id = ?', [usuario.id]);
      if (paciente && consulta.paciente_id === paciente.id) {
        temPermissao = true;
      }
    } else if (usuario.tipo === 'medico') {
      const medico = await database.get('SELECT id FROM medicos WHERE usuario_id = ?', [usuario.id]);
      if (medico && consulta.medico_id === medico.id) {
        temPermissao = true;
      }
    }
    
    if (!temPermissao) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para confirmar esta consulta',
          statusCode: 403
        }
      });
      return;
    }
    
    // Verificar se a consulta pode ser confirmada
    if (consulta.status !== 'agendada') {
      res.status(400).json({
        success: false,
        error: {
          message: `Consulta já está ${consulta.status}. Apenas consultas agendadas podem ser confirmadas.`,
          statusCode: 400
        }
      });
      return;
    }
    
    console.log('✅ Confirmando consulta - ID:', id, 'por usuário:', usuario.email);
    
    const consultaConfirmada = await ConsultaService.confirmar(id);
    
    // Criar notificações para paciente e médico
    try {
      // Buscar paciente e médico
      const consultaDetalhes = await ConsultaService.listar({ id });
      if (consultaDetalhes.length > 0) {
        const consulta = consultaDetalhes[0];
        
        // Notificação para o paciente
        if (consulta.paciente?.usuario_id) {
          await database.run(`
            INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
            VALUES (?, ?, ?, ?)
          `, [
            consulta.paciente.usuario_id,
            'Consulta Confirmada',
            `Sua consulta com ${consulta.medico?.usuario?.nome || 'o médico'} em ${consulta.data} às ${consulta.horario} foi confirmada.`,
            'success'
          ]);
        }
        
        // Notificação para o médico
        if (consulta.medico?.usuario_id) {
          await database.run(`
            INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
            VALUES (?, ?, ?, ?)
          `, [
            consulta.medico.usuario_id,
            'Consulta Confirmada',
            `A consulta com ${consulta.paciente?.usuario?.nome || 'o paciente'} em ${consulta.data} às ${consulta.horario} foi confirmada.`,
            'success'
          ]);
        }
      }
    } catch (notifError) {
      console.error('⚠️ Erro ao criar notificações de confirmação:', notifError);
      // Não falhar a requisição se a notificação falhar
    }
    
    res.json({
      success: true,
      data: consultaConfirmada,
      message: 'Consulta confirmada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao confirmar consulta:', error);
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
app.put('/api/consultas/:id/cancelar', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    
    if (!motivo || motivo.trim() === '') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Motivo do cancelamento é obrigatório',
          statusCode: 400
        }
      });
      return;
    }

    // Buscar consulta para verificar permissões
    const consultas = await ConsultaService.listar({ id });
    if (consultas.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Consulta não encontrada',
          statusCode: 404
        }
      });
      return;
    }
    
    const consulta = consultas[0];
    
    // Verificar permissões: paciente, médico ou admin podem cancelar
    let temPermissao = false;
    
    if (usuario.tipo === 'admin') {
      temPermissao = true;
    } else if (usuario.tipo === 'paciente') {
      const paciente = await database.get('SELECT id FROM pacientes WHERE usuario_id = ?', [usuario.id]);
      if (paciente && consulta.paciente_id === paciente.id) {
        temPermissao = true;
      }
    } else if (usuario.tipo === 'medico') {
      const medico = await database.get('SELECT id FROM medicos WHERE usuario_id = ?', [usuario.id]);
      if (medico && consulta.medico_id === medico.id) {
        temPermissao = true;
      }
    }
    
    if (!temPermissao) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para cancelar esta consulta',
          statusCode: 403
        }
      });
      return;
    }
    
    // Verificar se a consulta pode ser cancelada
    if (!['agendada', 'confirmada'].includes(consulta.status)) {
      res.status(400).json({
        success: false,
        error: {
          message: `Consulta já está ${consulta.status}. Apenas consultas agendadas ou confirmadas podem ser canceladas.`,
          statusCode: 400
        }
      });
      return;
    }
    
    console.log('❌ Cancelando consulta - ID:', id, 'por usuário:', usuario.email, 'motivo:', motivo);
    
    const consultaCancelada = await ConsultaService.cancelar(id, motivo.trim());
    
    // Criar notificações para paciente e médico
    try {
      // Buscar paciente e médico
      const consultaDetalhes = await ConsultaService.listar({ id });
      if (consultaDetalhes.length > 0) {
        const consulta = consultaDetalhes[0];
        const motivoFormatado = motivo.trim();
        const nomeUsuarioCancelou = usuario.nome || 'Usuário';
        
        // Notificação para o paciente (se não foi ele que cancelou)
        if (consulta.paciente?.usuario_id && usuario.tipo !== 'paciente') {
          await database.run(`
            INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
            VALUES (?, ?, ?, ?)
          `, [
            consulta.paciente.usuario_id,
            'Consulta Cancelada',
            `Sua consulta com ${consulta.medico?.usuario?.nome || 'o médico'} em ${consulta.data} às ${consulta.horario} foi cancelada por ${nomeUsuarioCancelou}. Motivo: ${motivoFormatado}`,
            'error'
          ]);
        }
        
        // Notificação para o médico (se não foi ele que cancelou)
        if (consulta.medico?.usuario_id && usuario.tipo !== 'medico') {
          await database.run(`
            INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
            VALUES (?, ?, ?, ?)
          `, [
            consulta.medico.usuario_id,
            'Consulta Cancelada',
            `A consulta com ${consulta.paciente?.usuario?.nome || 'o paciente'} em ${consulta.data} às ${consulta.horario} foi cancelada por ${nomeUsuarioCancelou}. Motivo: ${motivoFormatado}`,
            'error'
          ]);
        }
      }
    } catch (notifError) {
      console.error('⚠️ Erro ao criar notificações de cancelamento:', notifError);
      // Não falhar a requisição se a notificação falhar
    }
    
    res.json({
      success: true,
      data: consultaCancelada,
      message: 'Consulta cancelada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao cancelar consulta:', error);
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

// ==================== PRONTUÁRIOS ====================

// Listar prontuários
app.get('/api/prontuarios', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    const { paciente_id, consulta_id } = req.query;
    
    let sql = `
      SELECT 
        pr.*,
        p.usuario_id as paciente_usuario_id,
        u_p.nome as paciente_nome,
        m.usuario_id as medico_usuario_id,
        u_m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        c.data as consulta_data,
        c.horario as consulta_horario
      FROM prontuarios pr
      JOIN pacientes p ON pr.paciente_id = p.id
      JOIN usuarios u_p ON p.usuario_id = u_p.id
      JOIN medicos m ON pr.medico_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id
      LEFT JOIN consultas c ON pr.consulta_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Médicos só veem prontuários que criaram
    if (usuario.tipo === 'medico') {
      const medico = await database.get('SELECT id FROM medicos WHERE usuario_id = ?', [usuario.id]);
      if (medico) {
        sql += ' AND pr.medico_id = ?';
        params.push(medico.id);
      }
    }
    // Pacientes só veem seus próprios prontuários
    else if (usuario.tipo === 'paciente') {
      const paciente = await database.get('SELECT id FROM pacientes WHERE usuario_id = ?', [usuario.id]);
      if (paciente) {
        sql += ' AND pr.paciente_id = ?';
        params.push(paciente.id);
      }
    }
    
    if (paciente_id) {
      sql += ' AND pr.paciente_id = ?';
      params.push(paciente_id);
    }
    
    if (consulta_id) {
      sql += ' AND pr.consulta_id = ?';
      params.push(consulta_id);
    }
    
    sql += ' ORDER BY pr.data_atendimento DESC, pr.created_at DESC';
    
    const prontuarios = await database.all(sql, params);
    
    // Formatar dados
    const prontuariosFormatados = prontuarios.map((pr: any) => ({
      id: pr.id,
      paciente_id: pr.paciente_id,
      medico_id: pr.medico_id,
      consulta_id: pr.consulta_id,
      data_atendimento: pr.data_atendimento,
      paciente: {
        id: pr.paciente_id,
        usuario_id: pr.paciente_usuario_id,
        nome: pr.paciente_nome
      },
      medico: {
        id: pr.medico_id,
        usuario_id: pr.medico_usuario_id,
        nome: pr.medico_nome,
        especialidade: pr.medico_especialidade
      },
      consulta: pr.consulta_id ? {
        id: pr.consulta_id,
        data: pr.consulta_data,
        horario: pr.consulta_horario
      } : null,
      anamnese: pr.anamnese ? JSON.parse(pr.anamnese) : null,
      exame_fisico: pr.exame_fisico ? JSON.parse(pr.exame_fisico) : null,
      diagnostico: pr.diagnostico ? JSON.parse(pr.diagnostico) : null,
      prescricao: pr.prescricao ? JSON.parse(pr.prescricao) : null,
      observacoes: pr.observacoes,
      created_at: pr.created_at,
      updated_at: pr.updated_at
    }));
    
    res.json({
      success: true,
      data: prontuariosFormatados
    });
  } catch (error) {
    console.error('❌ Erro ao listar prontuários:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Buscar prontuário por ID
app.get('/api/prontuarios/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const id = parseInt(req.params.id);
    
    const prontuario = await database.get(`
      SELECT 
        pr.*,
        p.usuario_id as paciente_usuario_id,
        u_p.nome as paciente_nome,
        u_p.email as paciente_email,
        m.usuario_id as medico_usuario_id,
        u_m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        c.data as consulta_data,
        c.horario as consulta_horario
      FROM prontuarios pr
      JOIN pacientes p ON pr.paciente_id = p.id
      JOIN usuarios u_p ON p.usuario_id = u_p.id
      JOIN medicos m ON pr.medico_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id
      LEFT JOIN consultas c ON pr.consulta_id = c.id
      WHERE pr.id = ?
    `, [id]);
    
    if (!prontuario) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Prontuário não encontrado',
          statusCode: 404
        }
      });
      return;
    }
    
    // Formatar dados
    const prontuarioFormatado = {
      id: prontuario.id,
      paciente_id: prontuario.paciente_id,
      medico_id: prontuario.medico_id,
      consulta_id: prontuario.consulta_id,
      data_atendimento: prontuario.data_atendimento,
      paciente: {
        id: prontuario.paciente_id,
        usuario_id: prontuario.paciente_usuario_id,
        nome: prontuario.paciente_nome,
        email: prontuario.paciente_email
      },
      medico: {
        id: prontuario.medico_id,
        usuario_id: prontuario.medico_usuario_id,
        nome: prontuario.medico_nome,
        especialidade: prontuario.medico_especialidade
      },
      consulta: prontuario.consulta_id ? {
        id: prontuario.consulta_id,
        data: prontuario.consulta_data,
        horario: prontuario.consulta_horario
      } : null,
      anamnese: prontuario.anamnese ? JSON.parse(prontuario.anamnese) : null,
      exame_fisico: prontuario.exame_fisico ? JSON.parse(prontuario.exame_fisico) : null,
      diagnostico: prontuario.diagnostico ? JSON.parse(prontuario.diagnostico) : null,
      prescricao: prontuario.prescricao ? JSON.parse(prontuario.prescricao) : null,
      observacoes: prontuario.observacoes,
      created_at: prontuario.created_at,
      updated_at: prontuario.updated_at
    };
    
    res.json({
      success: true,
      data: prontuarioFormatado
    });
  } catch (error) {
    console.error('❌ Erro ao buscar prontuário:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Buscar prontuário por consulta
app.get('/api/prontuarios/consulta/:consulta_id', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const consulta_id = parseInt(req.params.consulta_id);
    
    const prontuario = await database.get(`
      SELECT * FROM prontuarios WHERE consulta_id = ?
    `, [consulta_id]);
    
    if (!prontuario) {
      res.json({
        success: true,
        data: []
      });
      return;
    }
    
    // Usar o mesmo formato do GET /api/prontuarios/:id
    const prontuarioCompleto = await database.get(`
      SELECT 
        pr.*,
        p.usuario_id as paciente_usuario_id,
        u_p.nome as paciente_nome,
        u_p.email as paciente_email,
        m.usuario_id as medico_usuario_id,
        u_m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        c.data as consulta_data,
        c.horario as consulta_horario
      FROM prontuarios pr
      JOIN pacientes p ON pr.paciente_id = p.id
      JOIN usuarios u_p ON p.usuario_id = u_p.id
      JOIN medicos m ON pr.medico_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id
      LEFT JOIN consultas c ON pr.consulta_id = c.id
      WHERE pr.id = ?
    `, [prontuario.id]);
    
    const prontuarioFormatado = {
      id: prontuarioCompleto.id,
      paciente_id: prontuarioCompleto.paciente_id,
      medico_id: prontuarioCompleto.medico_id,
      consulta_id: prontuarioCompleto.consulta_id,
      data_atendimento: prontuarioCompleto.data_atendimento,
      paciente: {
        id: prontuarioCompleto.paciente_id,
        usuario_id: prontuarioCompleto.paciente_usuario_id,
        nome: prontuarioCompleto.paciente_nome,
        email: prontuarioCompleto.paciente_email
      },
      medico: {
        id: prontuarioCompleto.medico_id,
        usuario_id: prontuarioCompleto.medico_usuario_id,
        nome: prontuarioCompleto.medico_nome,
        especialidade: prontuarioCompleto.medico_especialidade
      },
      consulta: prontuarioCompleto.consulta_id ? {
        id: prontuarioCompleto.consulta_id,
        data: prontuarioCompleto.consulta_data,
        horario: prontuarioCompleto.consulta_horario
      } : null,
      anamnese: prontuarioCompleto.anamnese ? JSON.parse(prontuarioCompleto.anamnese) : null,
      exame_fisico: prontuarioCompleto.exame_fisico ? JSON.parse(prontuarioCompleto.exame_fisico) : null,
      diagnostico: prontuarioCompleto.diagnostico ? JSON.parse(prontuarioCompleto.diagnostico) : null,
      prescricao: prontuarioCompleto.prescricao ? JSON.parse(prontuarioCompleto.prescricao) : null,
      observacoes: prontuarioCompleto.observacoes,
      created_at: prontuarioCompleto.created_at,
      updated_at: prontuarioCompleto.updated_at
    };
    
    res.json({
      success: true,
      data: [prontuarioFormatado]
    });
  } catch (error) {
    console.error('❌ Erro ao buscar prontuário por consulta:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Criar prontuário
app.post('/api/prontuarios', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    // Apenas médicos podem criar prontuários
    if (usuario.tipo !== 'medico' && usuario.tipo !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Apenas médicos podem criar prontuários',
          statusCode: 403
        }
      });
      return;
    }
    
    const { paciente_id, medico_id, consulta_id, data_atendimento, anamnese, exame_fisico, diagnostico, prescricao, observacoes } = req.body;
    
    if (!paciente_id || !medico_id || !data_atendimento) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Paciente, médico e data de atendimento são obrigatórios',
          statusCode: 400
        }
      });
      return;
    }
    
    // Se for médico, garantir que está criando prontuário para si mesmo
    if (usuario.tipo === 'medico') {
      const medico = await database.get('SELECT id FROM medicos WHERE usuario_id = ?', [usuario.id]);
      if (!medico || medico.id !== medico_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Você só pode criar prontuários para suas próprias consultas',
            statusCode: 403
          }
        });
        return;
      }
    }
    
    // Verificar se já existe prontuário para esta consulta
    if (consulta_id) {
      const prontuarioExistente = await database.get(
        'SELECT id FROM prontuarios WHERE consulta_id = ?',
        [consulta_id]
      );
      
      if (prontuarioExistente) {
        res.status(409).json({
          success: false,
          error: {
            message: 'Já existe um prontuário para esta consulta',
            statusCode: 409
          }
        });
        return;
      }
    }
    
    console.log('📝 Criando prontuário:', { paciente_id, medico_id, consulta_id });
    
    const result = await database.run(`
      INSERT INTO prontuarios (
        paciente_id, medico_id, consulta_id, data_atendimento,
        anamnese, exame_fisico, diagnostico, prescricao, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paciente_id,
      medico_id,
      consulta_id || null,
      data_atendimento,
      anamnese ? JSON.stringify(anamnese) : null,
      exame_fisico ? JSON.stringify(exame_fisico) : null,
      diagnostico ? JSON.stringify(diagnostico) : null,
      prescricao ? JSON.stringify(prescricao) : null,
      observacoes || null
    ]);
    
    // Buscar prontuário criado
    const prontuarioCriado = await database.get(`
      SELECT 
        pr.*,
        p.usuario_id as paciente_usuario_id,
        u_p.nome as paciente_nome,
        m.usuario_id as medico_usuario_id,
        u_m.nome as medico_nome,
        m.especialidade as medico_especialidade
      FROM prontuarios pr
      JOIN pacientes p ON pr.paciente_id = p.id
      JOIN usuarios u_p ON p.usuario_id = u_p.id
      JOIN medicos m ON pr.medico_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id
      WHERE pr.id = ?
    `, [result.lastID]);
    
    const prontuarioFormatado = {
      id: prontuarioCriado.id,
      paciente_id: prontuarioCriado.paciente_id,
      medico_id: prontuarioCriado.medico_id,
      consulta_id: prontuarioCriado.consulta_id,
      data_atendimento: prontuarioCriado.data_atendimento,
      paciente: {
        id: prontuarioCriado.paciente_id,
        usuario_id: prontuarioCriado.paciente_usuario_id,
        nome: prontuarioCriado.paciente_nome
      },
      medico: {
        id: prontuarioCriado.medico_id,
        usuario_id: prontuarioCriado.medico_usuario_id,
        nome: prontuarioCriado.medico_nome,
        especialidade: prontuarioCriado.medico_especialidade
      },
      anamnese: prontuarioCriado.anamnese ? JSON.parse(prontuarioCriado.anamnese) : null,
      exame_fisico: prontuarioCriado.exame_fisico ? JSON.parse(prontuarioCriado.exame_fisico) : null,
      diagnostico: prontuarioCriado.diagnostico ? JSON.parse(prontuarioCriado.diagnostico) : null,
      prescricao: prontuarioCriado.prescricao ? JSON.parse(prontuarioCriado.prescricao) : null,
      observacoes: prontuarioCriado.observacoes,
      created_at: prontuarioCriado.created_at,
      updated_at: prontuarioCriado.updated_at
    };
    
    console.log('✅ Prontuário criado com sucesso - ID:', result.lastID);
    
    res.status(201).json({
      success: true,
      data: prontuarioFormatado,
      message: 'Prontuário criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar prontuário:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Atualizar prontuário
app.put('/api/prontuarios/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    const id = parseInt(req.params.id);
    const { anamnese, exame_fisico, diagnostico, prescricao, observacoes } = req.body;
    
    // Verificar se prontuário existe
    const prontuarioExistente = await database.get('SELECT * FROM prontuarios WHERE id = ?', [id]);
    if (!prontuarioExistente) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Prontuário não encontrado',
          statusCode: 404
        }
      });
      return;
    }
    
    // Médicos só podem editar seus próprios prontuários
    if (usuario.tipo === 'medico') {
      const medico = await database.get('SELECT id FROM medicos WHERE usuario_id = ?', [usuario.id]);
      if (!medico || medico.id !== prontuarioExistente.medico_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Você só pode editar seus próprios prontuários',
            statusCode: 403
          }
        });
        return;
      }
    }
    
    // Atualizar prontuário
    await database.run(`
      UPDATE prontuarios 
      SET 
        anamnese = ?,
        exame_fisico = ?,
        diagnostico = ?,
        prescricao = ?,
        observacoes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      anamnese ? JSON.stringify(anamnese) : prontuarioExistente.anamnese,
      exame_fisico ? JSON.stringify(exame_fisico) : prontuarioExistente.exame_fisico,
      diagnostico ? JSON.stringify(diagnostico) : prontuarioExistente.diagnostico,
      prescricao ? JSON.stringify(prescricao) : prontuarioExistente.prescricao,
      observacoes !== undefined ? observacoes : prontuarioExistente.observacoes,
      id
    ]);
    
    // Buscar prontuário atualizado
    const prontuarioAtualizado = await database.get(`
      SELECT 
        pr.*,
        p.usuario_id as paciente_usuario_id,
        u_p.nome as paciente_nome,
        m.usuario_id as medico_usuario_id,
        u_m.nome as medico_nome,
        m.especialidade as medico_especialidade
      FROM prontuarios pr
      JOIN pacientes p ON pr.paciente_id = p.id
      JOIN usuarios u_p ON p.usuario_id = u_p.id
      JOIN medicos m ON pr.medico_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id
      WHERE pr.id = ?
    `, [id]);
    
    const prontuarioFormatado = {
      id: prontuarioAtualizado.id,
      paciente_id: prontuarioAtualizado.paciente_id,
      medico_id: prontuarioAtualizado.medico_id,
      consulta_id: prontuarioAtualizado.consulta_id,
      data_atendimento: prontuarioAtualizado.data_atendimento,
      paciente: {
        id: prontuarioAtualizado.paciente_id,
        usuario_id: prontuarioAtualizado.paciente_usuario_id,
        nome: prontuarioAtualizado.paciente_nome
      },
      medico: {
        id: prontuarioAtualizado.medico_id,
        usuario_id: prontuarioAtualizado.medico_usuario_id,
        nome: prontuarioAtualizado.medico_nome,
        especialidade: prontuarioAtualizado.medico_especialidade
      },
      anamnese: prontuarioAtualizado.anamnese ? JSON.parse(prontuarioAtualizado.anamnese) : null,
      exame_fisico: prontuarioAtualizado.exame_fisico ? JSON.parse(prontuarioAtualizado.exame_fisico) : null,
      diagnostico: prontuarioAtualizado.diagnostico ? JSON.parse(prontuarioAtualizado.diagnostico) : null,
      prescricao: prontuarioAtualizado.prescricao ? JSON.parse(prontuarioAtualizado.prescricao) : null,
      observacoes: prontuarioAtualizado.observacoes,
      created_at: prontuarioAtualizado.created_at,
      updated_at: prontuarioAtualizado.updated_at
    };
    
    console.log('✅ Prontuário atualizado com sucesso - ID:', id);
    
    res.json({
      success: true,
      data: prontuarioFormatado,
      message: 'Prontuário atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar prontuário:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// ==================== GESTÃO FINANCEIRA ====================

// Listar pagamentos
app.get('/api/pagamentos', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    console.log('💰 Listando pagamentos para usuário:', usuario.email);
    
    let query = `
      SELECT p.*, c.data, c.horario, c.tipo_consulta,
             u_p.nome as paciente_nome, u_m.nome as medico_nome
      FROM pagamentos p
      JOIN consultas c ON p.consulta_id = c.id
      JOIN pacientes pac ON c.paciente_id = pac.id
      JOIN usuarios u_p ON pac.usuario_id = u_p.id
      JOIN medicos m ON c.medico_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id
    `;
    
    const params: any[] = [];
    
    // Filtrar por tipo de usuário
    if (usuario.tipo === 'paciente') {
      query += ' WHERE pac.usuario_id = ?';
      params.push(usuario.id);
    } else if (usuario.tipo === 'medico') {
      query += ' WHERE m.usuario_id = ?';
      params.push(usuario.id);
    }
    // Admin vê todos
    
    query += ' ORDER BY p.created_at DESC';
    
    const pagamentos = await database.all(query, params);
    
    console.log(`✅ ${pagamentos.length} pagamentos encontrados`);
    
    res.json({
      success: true,
      data: pagamentos
    });
  } catch (error) {
    console.error('❌ Erro ao listar pagamentos:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Criar pagamento
app.post('/api/pagamentos', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    const { consulta_id, valor, forma_pagamento, observacoes } = req.body;
    
    // Verificar se a consulta existe e pertence ao usuário
    const consulta = await database.get(`
      SELECT c.*, pac.usuario_id as paciente_usuario_id, u_p.nome as paciente_nome, u_m.nome as medico_nome
      FROM consultas c
      JOIN pacientes pac ON c.paciente_id = pac.id
      JOIN usuarios u_p ON pac.usuario_id = u_p.id
      JOIN medicos m ON c.medico_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id
      WHERE c.id = ?
    `, [consulta_id]);
    
    if (!consulta) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Consulta não encontrada',
          statusCode: 404
        }
      });
      return;
    }
    
    // Verificar permissões
    if (usuario.tipo === 'paciente' && consulta.paciente_usuario_id !== usuario.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Você só pode criar pagamentos para suas próprias consultas',
          statusCode: 403
        }
      });
      return;
    }
    
    // Verificar se já existe pagamento para esta consulta
    const pagamentoExistente = await database.get(
      'SELECT * FROM pagamentos WHERE consulta_id = ?',
      [consulta_id]
    );
    
    if (pagamentoExistente) {
      res.status(409).json({
        success: false,
        error: {
          message: 'Já existe um pagamento para esta consulta',
          statusCode: 409
        }
      });
      return;
    }
    
    // Calcular data de vencimento (30 dias por padrão)
    const diasVencimento = 30;
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + diasVencimento);
    
    const result = await database.run(`
      INSERT INTO pagamentos (consulta_id, valor, forma_pagamento, data_vencimento, observacoes)
      VALUES (?, ?, ?, ?, ?)
    `, [consulta_id, valor, forma_pagamento, dataVencimento.toISOString().split('T')[0], observacoes]);
    
    console.log('✅ Pagamento criado - ID:', result.lastID, 'para consulta:', consulta_id);
    
    res.status(201).json({
      success: true,
      data: {
        id: result.lastID,
        consulta_id,
        valor,
        forma_pagamento,
        status: 'pendente',
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        observacoes
      },
      message: 'Pagamento criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar pagamento:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Confirmar pagamento
app.put('/api/pagamentos/:id/confirmar', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    const id = parseInt(req.params.id);
    
    // Verificar se o pagamento existe
    const pagamento = await database.get('SELECT * FROM pagamentos WHERE id = ?', [id]);
    if (!pagamento) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Pagamento não encontrado',
          statusCode: 404
        }
      });
      return;
    }
    
    // Apenas admin pode confirmar pagamentos
    if (usuario.tipo !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Apenas administradores podem confirmar pagamentos',
          statusCode: 403
        }
      });
      return;
    }
    
    // Atualizar status do pagamento
    await database.run(`
      UPDATE pagamentos 
      SET status = 'pago', data_pagamento = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
    
    // Atualizar status da consulta para 'realizada' se necessário
    await database.run(`
      UPDATE consultas 
      SET status = 'realizada'
      WHERE id = ? AND status = 'confirmada'
    `, [pagamento.consulta_id]);
    
    console.log('✅ Pagamento confirmado - ID:', id);
    
    res.json({
      success: true,
      message: 'Pagamento confirmado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao confirmar pagamento:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Listar faturas
app.get('/api/faturas', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    console.log('📄 Listando faturas para usuário:', usuario.email);
    
    let query = `
      SELECT f.*, c.data, c.horario, c.tipo_consulta,
             u_p.nome as paciente_nome, u_m.nome as medico_nome
      FROM faturas f
      JOIN consultas c ON f.consulta_id = c.id
      JOIN pacientes pac ON f.paciente_id = pac.id
      JOIN usuarios u_p ON pac.usuario_id = u_p.id
      JOIN medicos m ON f.medico_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id
    `;
    
    const params: any[] = [];
    
    // Filtrar por tipo de usuário
    if (usuario.tipo === 'paciente') {
      query += ' WHERE pac.usuario_id = ?';
      params.push(usuario.id);
    } else if (usuario.tipo === 'medico') {
      query += ' WHERE m.usuario_id = ?';
      params.push(usuario.id);
    }
    // Admin vê todas
    
    query += ' ORDER BY f.created_at DESC';
    
    const faturas = await database.all(query, params);
    
    console.log(`✅ ${faturas.length} faturas encontradas`);
    
    res.json({
      success: true,
      data: faturas
    });
  } catch (error) {
    console.error('❌ Erro ao listar faturas:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Gerar fatura para consulta
app.post('/api/faturas', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    // Apenas admin pode gerar faturas
    if (usuario.tipo !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Apenas administradores podem gerar faturas',
          statusCode: 403
        }
      });
      return;
    }
    
    const { consulta_id, valor_desconto = 0, observacoes } = req.body;
    
    // Buscar dados da consulta
    const consulta = await database.get(`
      SELECT c.*, pac.id as paciente_id_db, pac.usuario_id as paciente_usuario_id, 
             u_p.nome as paciente_nome, u_m.nome as medico_nome, m.especialidade, m.id as medico_id_db
      FROM consultas c
      JOIN pacientes pac ON c.paciente_id = pac.id
      JOIN usuarios u_p ON pac.usuario_id = u_p.id
      JOIN medicos m ON c.medico_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id
      WHERE c.id = ?
    `, [consulta_id]);
    
    if (!consulta) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Consulta não encontrada',
          statusCode: 404
        }
      });
      return;
    }
    
    // Verificar se já existe fatura para esta consulta
    const faturaExistente = await database.get(
      'SELECT * FROM faturas WHERE consulta_id = ?',
      [consulta_id]
    );
    
    if (faturaExistente) {
      res.status(409).json({
        success: false,
        error: {
          message: 'Já existe uma fatura para esta consulta',
          statusCode: 409
        }
      });
      return;
    }
    
    const valorTotal = consulta.valor || consulta.preco || 0;
    const valorFinal = valorTotal - valor_desconto;
    
    // Calcular data de vencimento
    const diasVencimento = 30;
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + diasVencimento);
    
    const result = await database.run(`
      INSERT INTO faturas (consulta_id, paciente_id, medico_id, valor_total, valor_desconto, valor_final, data_vencimento, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      consulta_id,
      consulta.paciente_id_db,
      consulta.medico_id_db,
      valorTotal,
      valor_desconto,
      valorFinal,
      dataVencimento.toISOString().split('T')[0],
      observacoes
    ]);
    
    console.log('✅ Fatura gerada - ID:', result.lastID, 'para consulta:', consulta_id);
    
    res.status(201).json({
      success: true,
      data: {
        id: result.lastID,
        consulta_id,
        paciente_id: consulta.paciente_id_db,
        medico_id: consulta.medico_id_db,
        valor_total: valorTotal,
        valor_desconto,
        valor_final: valorFinal,
        status: 'pendente',
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        observacoes
      },
      message: 'Fatura gerada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao gerar fatura:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// ==================== CONFIGURAÇÕES ====================

// Listar configurações
app.get('/api/configuracoes', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificação manual de token
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: { message: 'Usuário não encontrado', statusCode: 401 }
      });
      return;
    }
    
    // Apenas admin pode ver todas as configurações
    if (usuario.tipo !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Apenas administradores podem visualizar configurações',
          statusCode: 403
        }
      });
      return;
    }
    
    const configuracoes = await database.all('SELECT * FROM configuracoes ORDER BY chave ASC');
    
    res.json({
      success: true,
      data: configuracoes
    });
  } catch (error) {
    console.error('❌ Erro ao listar configurações:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Buscar configuração por chave
app.get('/api/configuracoes/:chave', async (req: Request, res: Response): Promise<void> => {
  try {
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario || usuario.tipo !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Apenas administradores podem visualizar configurações',
          statusCode: 403
        }
      });
      return;
    }
    
    const chave = req.params.chave;
    const configuracao = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
    
    if (!configuracao) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Configuração não encontrada',
          statusCode: 404
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: configuracao
    });
  } catch (error) {
    console.error('❌ Erro ao buscar configuração:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Criar configuração
app.post('/api/configuracoes', async (req: Request, res: Response): Promise<void> => {
  try {
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario || usuario.tipo !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Apenas administradores podem criar configurações',
          statusCode: 403
        }
      });
      return;
    }
    
    const { chave, valor, descricao } = req.body;
    
    if (!chave || !valor) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Chave e valor são obrigatórios',
          statusCode: 400
        }
      });
      return;
    }
    
    // Verificar se já existe
    const existente = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
    if (existente) {
      res.status(409).json({
        success: false,
        error: {
          message: 'Já existe uma configuração com esta chave',
          statusCode: 409
        }
      });
      return;
    }
    
    const result = await database.run(
      'INSERT INTO configuracoes (chave, valor, descricao) VALUES (?, ?, ?)',
      [chave, valor, descricao || null]
    );
    
    const novaConfig = await database.get('SELECT * FROM configuracoes WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      success: true,
      data: novaConfig,
      message: 'Configuração criada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar configuração:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Atualizar configuração
app.put('/api/configuracoes/:chave', async (req: Request, res: Response): Promise<void> => {
  try {
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario || usuario.tipo !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Apenas administradores podem atualizar configurações',
          statusCode: 403
        }
      });
      return;
    }
    
    const chave = req.params.chave;
    const { valor, descricao } = req.body;
    
    // Verificar se existe
    const existente = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
    if (!existente) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Configuração não encontrada',
          statusCode: 404
        }
      });
      return;
    }
    
    await database.run(
      'UPDATE configuracoes SET valor = ?, descricao = ?, updated_at = CURRENT_TIMESTAMP WHERE chave = ?',
      [valor, descricao || existente.descricao, chave]
    );
    
    const atualizada = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
    
    res.json({
      success: true,
      data: atualizada,
      message: 'Configuração atualizada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar configuração:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Deletar configuração
app.delete('/api/configuracoes/:chave', async (req: Request, res: Response): Promise<void> => {
  try {
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
    
    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario || usuario.tipo !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Apenas administradores podem remover configurações',
          statusCode: 403
        }
      });
      return;
    }
    
    const chave = req.params.chave;
    
    // Verificar se existe
    const existente = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
    if (!existente) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Configuração não encontrada',
          statusCode: 404
        }
      });
      return;
    }
    
    await database.run('DELETE FROM configuracoes WHERE chave = ?', [chave]);
    
    res.json({
      success: true,
      message: 'Configuração removida com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao remover configuração:', error);
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
    const usuario = req.usuario!;
    
    console.log('📬 Listando notificações do usuário:', usuario.email);
    
    const notificacoes = await database.all(`
      SELECT * FROM notificacoes 
      WHERE usuario_id = ? 
      ORDER BY created_at DESC
    `, [usuario.id]);

    console.log(`✅ ${notificacoes.length} notificações encontradas`);

    res.json({
      success: true,
      data: notificacoes
    });
  } catch (error) {
    console.error('❌ Erro ao listar notificações:', error);
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
app.put('/api/notificacoes/:id/lida', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario = req.usuario!;
    
    const id = parseInt(req.params.id);
    
    // Verificar se a notificação pertence ao usuário
    const notificacao = await database.get(
      'SELECT * FROM notificacoes WHERE id = ? AND usuario_id = ?',
      [id, usuario.id]
    );
    
    if (!notificacao) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Notificação não encontrada',
          statusCode: 404
        }
      });
      return;
    }
    
    await database.run(`
      UPDATE notificacoes 
      SET lida = 1 
      WHERE id = ? AND usuario_id = ?
    `, [id, usuario.id]);

    console.log('✅ Notificação marcada como lida - ID:', id);

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    console.error('❌ Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        statusCode: 500
      }
    });
  }
});

// Marcar todas as notificações como lidas
app.put('/api/notificacoes/marcar-todas-lidas', AuthService.authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario = req.usuario!;
    
    await database.run(`
      UPDATE notificacoes 
      SET lida = 1 
      WHERE usuario_id = ? AND lida = 0
    `, [usuario.id]);

    console.log('✅ Todas as notificações marcadas como lidas para usuário:', usuario.email);
    
    res.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas'
    });
  } catch (error) {
    console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
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
    const usuario = req.usuario!;
    
    const count = await database.get(`
      SELECT COUNT(*) as count FROM notificacoes 
      WHERE usuario_id = ? AND lida = 0
    `, [usuario.id]);

  res.json({
      success: true,
      data: { count: count.count }
    });
  } catch (error) {
    console.error('❌ Erro ao contar notificações não lidas:', error);
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