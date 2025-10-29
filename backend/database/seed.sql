-- Sistema de Agendamento Médico - Usuário Admin Inicial
-- Criado em: 2025-10-28

-- Inserir usuário administrador inicial para testes
INSERT INTO usuarios (nome, email, senha, tipo, telefone, cpf, data_nascimento, endereco) VALUES
('Administrador Sistema', 'admin@clinica.com', '$2b$10$XBuqIR77asrgr6xicvp3xOII2cIgefR9nHMUPFu/5hCyUA0vtQO/S', 'admin', '(11) 99999-9999', '000.000.000-00', '1980-01-01', 'Rua Administração, 1 - Centro');

-- Senha: 123456 (hash bcrypt)