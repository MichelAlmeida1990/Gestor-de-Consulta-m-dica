-- Sistema de Gestão Financeira - SQLite
-- Tabelas para pagamentos, faturamento e relatórios financeiros

-- Tabela de pagamentos
CREATE TABLE pagamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consulta_id INTEGER REFERENCES consultas(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL, -- dinheiro, cartao_credito, cartao_debito, pix, transferencia
    status VARCHAR(20) CHECK (status IN ('pendente', 'pago', 'cancelado', 'reembolsado')) DEFAULT 'pendente',
    data_pagamento DATETIME,
    data_vencimento DATE,
    observacoes TEXT,
    comprovante_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de faturas/recibos
CREATE TABLE faturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_fatura VARCHAR(50) UNIQUE NOT NULL,
    consulta_id INTEGER REFERENCES consultas(id) ON DELETE CASCADE,
    paciente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    medico_id INTEGER REFERENCES medicos(id) ON DELETE CASCADE,
    valor_total DECIMAL(10,2) NOT NULL,
    valor_desconto DECIMAL(10,2) DEFAULT 0,
    valor_final DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pendente', 'paga', 'cancelada', 'vencida')) DEFAULT 'pendente',
    data_emissao DATE DEFAULT (date('now')),
    data_vencimento DATE,
    data_pagamento DATE,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de despesas da clínica
CREATE TABLE despesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- aluguel, salarios, equipamentos, manutencao, marketing, outros
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE,
    data_pagamento DATE,
    status VARCHAR(20) CHECK (status IN ('pendente', 'pago', 'cancelado')) DEFAULT 'pendente',
    forma_pagamento VARCHAR(50),
    observacoes TEXT,
    comprovante_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de comissões dos médicos
CREATE TABLE comissoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medico_id INTEGER REFERENCES medicos(id) ON DELETE CASCADE,
    consulta_id INTEGER REFERENCES consultas(id) ON DELETE CASCADE,
    valor_consulta DECIMAL(10,2) NOT NULL,
    percentual_comissao DECIMAL(5,2) NOT NULL, -- ex: 70.00 para 70%
    valor_comissao DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pendente', 'pago', 'cancelado')) DEFAULT 'pendente',
    data_pagamento DATE,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relatórios financeiros (cache de relatórios)
CREATE TABLE relatorios_financeiros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo VARCHAR(50) NOT NULL, -- mensal, semanal, diario, anual
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    receita_total DECIMAL(12,2) DEFAULT 0,
    despesa_total DECIMAL(12,2) DEFAULT 0,
    lucro_liquido DECIMAL(12,2) DEFAULT 0,
    total_consultas INTEGER DEFAULT 0,
    total_pagamentos INTEGER DEFAULT 0,
    dados_detalhados TEXT, -- JSON como texto no SQLite
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_pagamentos_consulta ON pagamentos(consulta_id);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);
CREATE INDEX idx_pagamentos_data ON pagamentos(data_pagamento);
CREATE INDEX idx_faturas_paciente ON faturas(paciente_id);
CREATE INDEX idx_faturas_medico ON faturas(medico_id);
CREATE INDEX idx_faturas_status ON faturas(status);
CREATE INDEX idx_faturas_data_emissao ON faturas(data_emissao);
CREATE INDEX idx_despesas_categoria ON despesas(categoria);
CREATE INDEX idx_despesas_status ON despesas(status);
CREATE INDEX idx_despesas_data_vencimento ON despesas(data_vencimento);
CREATE INDEX idx_comissoes_medico ON comissoes(medico_id);
CREATE INDEX idx_comissoes_status ON comissoes(status);
CREATE INDEX idx_relatorios_tipo ON relatorios_financeiros(tipo);
CREATE INDEX idx_relatorios_periodo ON relatorios_financeiros(periodo_inicio, periodo_fim);

-- Inserir configurações financeiras padrão
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
('percentual_comissao_padrao', '70.00', 'Percentual padrão de comissão dos médicos', 'number'),
('dias_vencimento_fatura', '30', 'Dias para vencimento de faturas', 'number'),
('taxa_cartao_credito', '3.5', 'Taxa para pagamentos com cartão de crédito (%)', 'number'),
('taxa_cartao_debito', '1.5', 'Taxa para pagamentos com cartão de débito (%)', 'number'),
('taxa_pix', '0.0', 'Taxa para pagamentos via PIX (%)', 'number'),
('desconto_pagamento_vista', '5.0', 'Desconto para pagamento à vista (%)', 'number'),
('multa_atraso', '2.0', 'Multa por atraso no pagamento (%)', 'number'),
('juros_mes', '1.0', 'Juros mensais por atraso (%)', 'number');

