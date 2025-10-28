// Backend temporário sem banco de dados para demonstração
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());
app.use(compression());

// Rate limiting - DESABILITADO PARA DEBUG
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 100, // máximo 100 requests por IP
//   message: {
//     error: 'Muitas requisições deste IP, tente novamente mais tarde.',
//     retryAfter: '15 minutos'
//   },
// });

// app.use(limiter);

// CORS
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development',
    version: '1.0.0',
    message: 'Sistema funcionando em modo demonstração'
  });
});

// Rota de login mock
app.post('/api/auth/login', (req, res) => {
  const { email, senha } = req.body;
  
  // Usuários de teste com 3 tipos diferentes
  const usuarios = {
    // 👨‍💼 ADMINISTRADORES
    'admin@clinica.com': { id: 1, nome: 'Administrador', tipo: 'admin', senha: 'admin123' },
    
    // 👨‍⚕️ MÉDICOS
    'joao.silva@clinica.com': { id: 2, nome: 'Dr. João Silva', tipo: 'medico', senha: '123456' },
    'maria.santos@clinica.com': { id: 3, nome: 'Dra. Maria Santos', tipo: 'medico', senha: '123456' },
    'michel@clinica.com': { id: 4, nome: 'Dr. Michel', tipo: 'medico', senha: '123456' },
    
    // 👤 PACIENTES
    'joao.silva@email.com': { id: 5, nome: 'João Silva', tipo: 'paciente', senha: '123456' },
    'maria.santos@email.com': { id: 6, nome: 'Maria Santos', tipo: 'paciente', senha: '123456' },
    'carlos.mendes@email.com': { id: 7, nome: 'Carlos Mendes', tipo: 'paciente', senha: '123456' }
  };

  const usuario = usuarios[email as keyof typeof usuarios];
  
  if (usuario && usuario.senha === senha) {
    res.json({
      success: true,
      data: {
        token: 'mock_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: email,
          tipo: usuario.tipo,
          ativo: true
        },
        expiresIn: '24h'
      },
      message: 'Login realizado com sucesso'
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        message: 'Email ou senha incorretos',
        statusCode: 401
      }
    });
  }
});

// Rota de registro mock
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    data: {
      token: 'mock_token_' + Date.now(),
      usuario: {
        id: Math.floor(Math.random() * 1000),
        nome: req.body.nome,
        email: req.body.email,
        tipo: req.body.tipo,
        ativo: true
      }
    },
    message: 'Usuário cadastrado com sucesso'
  });
});

// Array para simular banco de dados de consultas
let consultasMock = [
  {
    id: 1,
    paciente: { nome: 'Carlos Mendes', email: 'carlos.mendes@email.com' },
    medico: { nome: 'Dr. João Silva', especialidade: 'Cardiologia' },
    data: '2025-10-28',
    horario: '09:00',
    status: 'agendada',
    tipo: 'Consulta de rotina',
    observacoes: 'Primeira consulta',
    motivo_cancelamento: undefined
  },
  {
    id: 2,
    paciente: { nome: 'Fernanda Lima', email: 'fernanda.lima@email.com' },
    medico: { nome: 'Dra. Maria Santos', especialidade: 'Dermatologia' },
    data: '2025-10-29',
    horario: '14:30',
    status: 'confirmada',
    tipo: 'Consulta especializada',
    observacoes: 'Retorno',
    motivo_cancelamento: undefined
  }
];

// Rota mock para consultas - GET
app.get('/api/consultas', (req, res) => {
  res.json({
    success: true,
    data: {
      consultas: consultasMock,
      pagination: {
        page: 1,
        limit: 5,
        total: consultasMock.length,
        totalPages: 1
      }
    }
  });
});

// Rota mock para criar consultas - POST
app.post('/api/consultas', (req, res) => {
  console.log('Dados recebidos:', JSON.stringify(req.body, null, 2));
  const { medico_id, sala_id, data, horario, tipo_consulta, observacoes, urgencia, paciente_id } = req.body;
  
  // Validar dados obrigatórios
  if (!medico_id || !data || !horario || !tipo_consulta || !paciente_id) {
    console.log('Dados obrigatórios faltando:', {
      medico_id: !!medico_id,
      data: !!data,
      horario: !!horario,
      tipo_consulta: !!tipo_consulta,
      paciente_id: !!paciente_id
    });
    res.status(400).json({
      success: false,
      error: {
        message: 'Dados obrigatórios não fornecidos',
        statusCode: 400
      }
    });
    return;
  }
  
  // Buscar dados do médico
  const medicos = [
    { id: 2, nome: 'Dr. João Silva', especialidade: 'Cardiologia' },
    { id: 3, nome: 'Dra. Maria Santos', especialidade: 'Dermatologia' },
    { id: 4, nome: 'Dr. Michel', especialidade: 'Clínica Geral' }
  ];
  
  const medico = medicos.find(m => m.id === medico_id);
  if (!medico) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Médico não encontrado',
        statusCode: 400
      }
    });
    return;
  }
  
  // Buscar dados do paciente
  const pacientes = [
    { id: 5, nome: 'João Silva', email: 'joao.silva@email.com' },
    { id: 6, nome: 'Maria Santos', email: 'maria.santos@email.com' },
    { id: 7, nome: 'Carlos Mendes', email: 'carlos.mendes@email.com' }
  ];
  
  const paciente = pacientes.find(p => p.id === paciente_id);
  if (!paciente) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Paciente não encontrado',
        statusCode: 400
      }
    });
    return;
  }
  
  // Verificar conflito de horário
  const conflito = consultasMock.find(c => 
    c.medico.nome === medico.nome &&
    c.data === data &&
    c.horario === horario &&
    c.status !== 'cancelada'
  );
  
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
  
  // Criar nova consulta
  const novaConsulta = {
    id: consultasMock.length + 1,
    paciente: paciente,
    medico: medico,
    data: data,
    horario: horario,
    status: 'agendada',
    tipo: tipo_consulta,
    observacoes: observacoes || '',
    urgencia: urgencia || 'normal',
    sala_id: sala_id || null,
    created_at: new Date().toISOString(),
    motivo_cancelamento: undefined
  };
  
  consultasMock.push(novaConsulta);
  
  res.status(201).json({
    success: true,
    data: novaConsulta,
    message: 'Consulta agendada com sucesso'
  });
});

// Rota mock para cancelar consulta - POST
app.post('/api/consultas/:id/cancelar', (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;
  
  const consultaIndex = consultasMock.findIndex(c => c.id === parseInt(id));
  
  if (consultaIndex === -1) {
    res.status(404).json({
      success: false,
      error: {
        message: 'Consulta não encontrada',
        statusCode: 404
      }
    });
    return;
  }
  
  consultasMock[consultaIndex].status = 'cancelada';
  consultasMock[consultaIndex] = {
    ...consultasMock[consultaIndex],
    status: 'cancelada',
    motivo_cancelamento: motivo || 'Cancelado pelo usuário'
  };
  
  res.json({
    success: true,
    data: consultasMock[consultaIndex],
    message: 'Consulta cancelada com sucesso'
  });
});

// Rota mock para confirmar consulta - POST
app.post('/api/consultas/:id/confirmar', (req, res) => {
  const { id } = req.params;
  
  const consultaIndex = consultasMock.findIndex(c => c.id === parseInt(id));
  
  if (consultaIndex === -1) {
    res.status(404).json({
      success: false,
      error: {
        message: 'Consulta não encontrada',
        statusCode: 404
      }
    });
    return;
  }
  
  if (consultasMock[consultaIndex].status !== 'agendada') {
    res.status(400).json({
      success: false,
      error: {
        message: 'Apenas consultas agendadas podem ser confirmadas',
        statusCode: 400
      }
    });
    return;
  }
  
  consultasMock[consultaIndex].status = 'confirmada';
  
  res.json({
    success: true,
    data: consultasMock[consultaIndex],
    message: 'Consulta confirmada com sucesso'
  });
});

// Rotas mock para notificações
app.get('/api/notificacoes', (req, res) => {
  const notificacoes = [
    {
      id: 1,
      titulo: 'Consulta Agendada',
      mensagem: 'Sua consulta com Dr. João Silva foi agendada para 28/10/2025 às 09:00',
      tipo: 'info',
      lida: false,
      data: new Date().toISOString()
    },
    {
      id: 2,
      titulo: 'Lembrete de Consulta',
      mensagem: 'Você tem uma consulta em 2 horas com Dra. Maria Santos',
      tipo: 'warning',
      lida: false,
      data: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: notificacoes,
    pagination: {
      page: 1,
      limit: 5,
      total: notificacoes.length,
      totalPages: 1
    }
  });
});

app.get('/api/notificacoes/nao-lidas', (req, res) => {
  res.json({
    success: true,
    data: {
      count: 2,
      notificacoes: [
        {
          id: 1,
          titulo: 'Consulta Agendada',
          mensagem: 'Sua consulta com Dr. João Silva foi agendada',
          tipo: 'info',
          data: new Date().toISOString()
        },
        {
          id: 2,
          titulo: 'Lembrete de Consulta',
          mensagem: 'Você tem uma consulta em 2 horas',
          tipo: 'warning',
          data: new Date().toISOString()
        }
      ]
    }
  });
});

// Array para simular banco de dados de médicos
let medicosMock = [
  {
    id: 2,
    nome: 'Dr. João Silva',
    especialidade: 'Cardiologia',
    crm: '12345-SP',
    telefone: '(11) 99999-1111',
    email: 'joao.silva@clinica.com',
    ativo: true,
    created_at: '2025-10-28T17:08:21.636Z'
  },
  {
    id: 3,
    nome: 'Dra. Maria Santos',
    especialidade: 'Dermatologia',
    crm: '67890-SP',
    telefone: '(11) 99999-2222',
    email: 'maria.santos@clinica.com',
    ativo: true,
    created_at: '2025-10-28T17:08:21.636Z'
  },
  {
    id: 4,
    nome: 'Dr. Michel',
    especialidade: 'Clínica Geral',
    crm: '11111-SP',
    telefone: '(11) 99999-3333',
    email: 'michel@clinica.com',
    ativo: true,
    created_at: '2025-10-28T17:08:21.636Z'
  }
];

// Rota mock para médicos - GET
app.get('/api/medicos', (req, res) => {
  let medicosFiltrados = [...medicosMock];
  
  // Aplicar filtros
  if (req.query.especialidade && typeof req.query.especialidade === 'string' && req.query.especialidade !== '') {
    const especialidade = req.query.especialidade.toLowerCase();
    medicosFiltrados = medicosFiltrados.filter(m => 
      m.especialidade.toLowerCase().includes(especialidade)
    );
  }
  
  if (req.query.ativo !== undefined && req.query.ativo !== '') {
    const ativo = req.query.ativo === 'true';
    medicosFiltrados = medicosFiltrados.filter(m => m.ativo === ativo);
  }
  
  if (req.query.busca && typeof req.query.busca === 'string' && req.query.busca !== '') {
    const busca = req.query.busca.toLowerCase();
    medicosFiltrados = medicosFiltrados.filter(m => 
      m.nome.toLowerCase().includes(busca) || 
      m.crm.toLowerCase().includes(busca)
    );
  }
  
  res.json({
    success: true,
    data: medicosFiltrados
  });
});

// Rota mock para criar médico - POST
app.post('/api/medicos', (req, res) => {
  const { nome, especialidade, crm, telefone, email, ativo } = req.body;
  
  // Validar dados obrigatórios
  if (!nome || !especialidade || !crm || !telefone || !email) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Dados obrigatórios não fornecidos',
        statusCode: 400
      }
    });
    return;
  }
  
  // Verificar se CRM já existe
  const crmExistente = medicosMock.find(m => m.crm === crm);
  if (crmExistente) {
    res.status(409).json({
      success: false,
      error: {
        message: 'CRM já cadastrado',
        statusCode: 409
      }
    });
    return;
  }
  
  // Verificar se email já existe
  const emailExistente = medicosMock.find(m => m.email === email);
  if (emailExistente) {
    res.status(409).json({
      success: false,
      error: {
        message: 'Email já cadastrado',
        statusCode: 409
      }
    });
    return;
  }
  
  // Criar novo médico
  const novoMedico = {
    id: medicosMock.length + 1,
    nome,
    especialidade,
    crm,
    telefone,
    email,
    ativo: ativo !== undefined ? ativo : true,
    created_at: new Date().toISOString()
  };
  
  medicosMock.push(novoMedico);
  
  res.status(201).json({
    success: true,
    data: novoMedico,
    message: 'Médico cadastrado com sucesso'
  });
});

// Rota mock para atualizar médico - PUT
app.put('/api/medicos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, especialidade, crm, telefone, email, ativo } = req.body;
  
  const medicoIndex = medicosMock.findIndex(m => m.id === parseInt(id));
  
  if (medicoIndex === -1) {
    res.status(404).json({
      success: false,
      error: {
        message: 'Médico não encontrado',
        statusCode: 404
      }
    });
    return;
  }
  
  // Verificar se CRM já existe (exceto para o próprio médico)
  if (crm && crm !== medicosMock[medicoIndex].crm) {
    const crmExistente = medicosMock.find(m => m.crm === crm && m.id !== parseInt(id));
    if (crmExistente) {
      res.status(409).json({
        success: false,
        error: {
          message: 'CRM já cadastrado',
          statusCode: 409
        }
      });
      return;
    }
  }
  
  // Verificar se email já existe (exceto para o próprio médico)
  if (email && email !== medicosMock[medicoIndex].email) {
    const emailExistente = medicosMock.find(m => m.email === email && m.id !== parseInt(id));
    if (emailExistente) {
      res.status(409).json({
        success: false,
        error: {
          message: 'Email já cadastrado',
          statusCode: 409
        }
      });
      return;
    }
  }
  
  // Atualizar médico
  medicosMock[medicoIndex] = {
    ...medicosMock[medicoIndex],
    nome: nome || medicosMock[medicoIndex].nome,
    especialidade: especialidade || medicosMock[medicoIndex].especialidade,
    crm: crm || medicosMock[medicoIndex].crm,
    telefone: telefone || medicosMock[medicoIndex].telefone,
    email: email || medicosMock[medicoIndex].email,
    ativo: ativo !== undefined ? ativo : medicosMock[medicoIndex].ativo
  };
  
  res.json({
    success: true,
    data: medicosMock[medicoIndex],
    message: 'Médico atualizado com sucesso'
  });
});

// Rota mock para alterar status do médico - PUT
app.put('/api/medicos/:id/status', (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;
  
  const medicoIndex = medicosMock.findIndex(m => m.id === parseInt(id));
  
  if (medicoIndex === -1) {
    res.status(404).json({
      success: false,
      error: {
        message: 'Médico não encontrado',
        statusCode: 404
      }
    });
    return;
  }
  
  medicosMock[medicoIndex].ativo = ativo;
  
  res.json({
    success: true,
    data: medicosMock[medicoIndex],
    message: `Médico ${ativo ? 'ativado' : 'desativado'} com sucesso`
  });
});

// Rota mock para deletar médico - DELETE
app.delete('/api/medicos/:id', (req, res) => {
  const { id } = req.params;
  
  const medicoIndex = medicosMock.findIndex(m => m.id === parseInt(id));
  
  if (medicoIndex === -1) {
    res.status(404).json({
      success: false,
      error: {
        message: 'Médico não encontrado',
        statusCode: 404
      }
    });
    return;
  }
  
  // Verificar se médico tem consultas agendadas
  const temConsultas = consultasMock.some(c => 
    c.medico.nome === medicosMock[medicoIndex].nome && 
    c.status !== 'cancelada' && 
    c.status !== 'realizada'
  );
  
  if (temConsultas) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Não é possível remover médico com consultas agendadas',
        statusCode: 400
      }
    });
    return;
  }
  
  medicosMock.splice(medicoIndex, 1);
  
  res.json({
    success: true,
    message: 'Médico removido com sucesso'
  });
});

// Rota mock para salas
app.get('/api/salas', (req, res) => {
  const salas = [
    {
      id: 1,
      nome: 'Sala 101',
      tipo: 'Consulta',
      capacidade: 1,
      equipamentos: ['Mesa', 'Cadeira', 'Computador'],
      ativa: true
    },
    {
      id: 2,
      nome: 'Sala 102',
      tipo: 'Consulta',
      capacidade: 1,
      equipamentos: ['Mesa', 'Cadeira', 'Computador', 'Eletrocardiograma'],
      ativa: true
    }
  ];
  
  res.json({
    success: true,
    data: salas
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Agendamento Médico API',
    version: '1.0.0',
    status: 'Modo Demonstração',
    health: '/api/health',
    login: '/api/auth/login'
  });
});

// Middleware de tratamento de erros
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Rota não encontrada: ${req.originalUrl}`,
      statusCode: 404
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📚 Ambiente: development (modo demonstração)`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login Mock: http://localhost:${PORT}/api/auth/login`);
});

export default app;
