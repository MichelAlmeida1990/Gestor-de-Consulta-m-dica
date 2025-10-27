-- Sistema de Agendamento Médico
-- Banco de dados PostgreSQL

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários (pacientes, médicos, admins)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('paciente', 'medico', 'admin')) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE,
    endereco JSONB,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de médicos
CREATE TABLE medicos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    crm VARCHAR(20) UNIQUE NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    sub_especialidade VARCHAR(100),
    preco_consulta DECIMAL(10,2),
    tempo_consulta INTEGER DEFAULT 30, -- minutos
    tempo_intervalo INTEGER DEFAULT 15, -- minutos entre consultas
    bio TEXT,
    foto_url VARCHAR(500),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de salas
CREATE TABLE salas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    numero VARCHAR(20),
    andar INTEGER,
    equipamentos TEXT[],
    capacidade INTEGER DEFAULT 1,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de horários de trabalho dos médicos
CREATE TABLE horarios_trabalho (
    id SERIAL PRIMARY KEY,
    medico_id INTEGER REFERENCES medicos(id) ON DELETE CASCADE,
    dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6), -- 0=domingo, 6=sábado
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de horários disponíveis (gerada automaticamente)
CREATE TABLE horarios_disponiveis (
    id SERIAL PRIMARY KEY,
    medico_id INTEGER REFERENCES medicos(id) ON DELETE CASCADE,
    sala_id INTEGER REFERENCES salas(id),
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    disponivel BOOLEAN DEFAULT true,
    tipo_consulta VARCHAR(50) DEFAULT 'geral',
    preco DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(medico_id, sala_id, data, hora_inicio)
);

-- Tabela de consultas
CREATE TABLE consultas (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    paciente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    medico_id INTEGER REFERENCES medicos(id) ON DELETE CASCADE,
    sala_id INTEGER REFERENCES salas(id),
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    tipo_consulta VARCHAR(50) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('agendada', 'confirmada', 'realizada', 'cancelada', 'reagendada')) DEFAULT 'agendada',
    observacoes TEXT,
    sintomas TEXT,
    urgencia INTEGER CHECK (urgencia BETWEEN 1 AND 5) DEFAULT 3,
    preco DECIMAL(10,2),
    forma_pagamento VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de tipos de consulta
CREATE TABLE tipos_consulta (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    duracao INTEGER NOT NULL, -- minutos
    preco_base DECIMAL(10,2),
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    data_envio TIMESTAMP DEFAULT NOW(),
    data_leitura TIMESTAMP
);

-- Tabela de logs de agendamento
CREATE TABLE logs_agendamento (
    id SERIAL PRIMARY KEY,
    consulta_id INTEGER REFERENCES consultas(id) ON DELETE CASCADE,
    acao VARCHAR(50) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    detalhes JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_medicos_especialidade ON medicos(especialidade);
CREATE INDEX idx_medicos_ativo ON medicos(ativo);
CREATE INDEX idx_horarios_disponiveis_data ON horarios_disponiveis(data);
CREATE INDEX idx_horarios_disponiveis_medico_data ON horarios_disponiveis(medico_id, data);
CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX idx_consultas_medico ON consultas(medico_id);
CREATE INDEX idx_consultas_data ON consultas(data);
CREATE INDEX idx_consultas_status ON consultas(status);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicos_updated_at BEFORE UPDATE ON medicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultas_updated_at BEFORE UPDATE ON consultas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO tipos_consulta (nome, duracao, preco_base, descricao) VALUES
('Consulta Geral', 30, 150.00, 'Consulta médica geral'),
('Consulta de Especialidade', 45, 200.00, 'Consulta com especialista'),
('Retorno', 20, 100.00, 'Consulta de retorno'),
('Emergência', 60, 300.00, 'Consulta de emergência'),
('Teleconsulta', 30, 120.00, 'Consulta online');

INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
('horario_funcionamento_inicio', '08:00', 'Horário de início do funcionamento da clínica', 'time'),
('horario_funcionamento_fim', '18:00', 'Horário de fim do funcionamento da clínica', 'time'),
('dias_funcionamento', '[1,2,3,4,5]', 'Dias da semana que a clínica funciona (0=domingo)', 'array'),
('tempo_antecedencia_minimo', '24', 'Tempo mínimo em horas para agendar consulta', 'number'),
('tempo_antecedencia_maximo', '720', 'Tempo máximo em horas para agendar consulta', 'number'),
('max_consultas_dia_medico', '20', 'Máximo de consultas por médico por dia', 'number'),
('email_notificacoes', 'true', 'Enviar notificações por email', 'boolean'),
('sms_notificacoes', 'false', 'Enviar notificações por SMS', 'boolean');

-- Inserir salas padrão
INSERT INTO salas (nome, numero, andar, equipamentos, capacidade) VALUES
('Sala 1', '101', 1, ARRAY['Mesa', 'Cadeira', 'Computador'], 1),
('Sala 2', '102', 1, ARRAY['Mesa', 'Cadeira', 'Computador', 'Estetoscópio'], 1),
('Sala 3', '201', 2, ARRAY['Mesa', 'Cadeira', 'Computador', 'Esfigmomanômetro'], 1),
('Sala 4', '202', 2, ARRAY['Mesa', 'Cadeira', 'Computador', 'Otoscópio'], 1),
('Sala de Emergência', 'ER01', 1, ARRAY['Macas', 'Equipamentos de emergência'], 2);
