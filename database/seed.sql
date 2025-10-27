-- Dados de exemplo para desenvolvimento e testes

-- Inserir usuário administrador
INSERT INTO usuarios (nome, email, senha, tipo, telefone, cpf) VALUES
('Administrador Sistema', 'admin@clinica.com', '$2b$10$rQZ8Kj9LmNpOqRsTvWxY3eFgHjKlMnBvCxZyAsDfGhJkLmNpOqRsT', 'admin', '(11) 99999-9999', '000.000.000-00');

-- Inserir médicos de exemplo
INSERT INTO usuarios (nome, email, senha, tipo, telefone, cpf, data_nascimento) VALUES
('Dr. João Silva', 'joao.silva@clinica.com', '$2b$10$rQZ8Kj9LmNpOqRsTvWxY3eFgHjKlMnBvCxZyAsDfGhJkLmNpOqRsT', 'medico', '(11) 98888-8888', '111.111.111-11', '1980-05-15'),
('Dra. Maria Santos', 'maria.santos@clinica.com', '$2b$10$rQZ8Kj9LmNpOqRsTvWxY3eFgHjKlMnBvCxZyAsDfGhJkLmNpOqRsT', 'medico', '(11) 97777-7777', '222.222.222-22', '1985-08-20'),
('Dr. Pedro Costa', 'pedro.costa@clinica.com', '$2b$10$rQZ8Kj9LmNpOqRsTvWxY3eFgHjKlMnBvCxZyAsDfGhJkLmNpOqRsT', 'medico', '(11) 96666-6666', '333.333.333-33', '1975-12-10'),
('Dra. Ana Oliveira', 'ana.oliveira@clinica.com', '$2b$10$rQZ8Kj9LmNpOqRsTvWxY3eFgHjKlMnBvCxZyAsDfGhJkLmNpOqRsT', 'medico', '(11) 95555-5555', '444.444.444-44', '1990-03-25');

-- Inserir dados dos médicos
INSERT INTO medicos (usuario_id, crm, especialidade, sub_especialidade, preco_consulta, tempo_consulta, bio) VALUES
(2, 'CRM123456', 'Cardiologia', 'Cardiologia Clínica', 250.00, 45, 'Especialista em cardiologia com 15 anos de experiência'),
(3, 'CRM234567', 'Dermatologia', 'Dermatologia Estética', 200.00, 30, 'Especialista em dermatologia e estética'),
(4, 'CRM345678', 'Ortopedia', 'Cirurgia do Joelho', 300.00, 60, 'Especialista em ortopedia e cirurgia do joelho'),
(5, 'CRM456789', 'Pediatria', 'Neonatologia', 180.00, 30, 'Especialista em pediatria e neonatologia');

-- Inserir pacientes de exemplo
INSERT INTO usuarios (nome, email, senha, tipo, telefone, cpf, data_nascimento, endereco) VALUES
('Carlos Mendes', 'carlos.mendes@email.com', '$2b$10$rQZ8Kj9LmNpOqRsTvWxY3eFgHjKlMnBvCxZyAsDfGhJkLmNpOqRsT', 'paciente', '(11) 94444-4444', '555.555.555-55', '1992-07-12', '{"rua": "Rua das Flores, 123", "cidade": "São Paulo", "cep": "01234-567"}'),
('Fernanda Lima', 'fernanda.lima@email.com', '$2b$10$rQZ8Kj9LmNpOqRsTvWxY3eFgHjKlMnBvCxZyAsDfGhJkLmNpOqRsT', 'paciente', '(11) 93333-3333', '666.666.666-66', '1988-11-30', '{"rua": "Av. Paulista, 456", "cidade": "São Paulo", "cep": "01310-100"}'),
('Roberto Alves', 'roberto.alves@email.com', '$2b$10$rQZ8Kj9LmNpOqRsTvWxY3eFgHjKlMnBvCxZyAsDfGhJkLmNpOqRsT', 'paciente', '(11) 92222-2222', '777.777.777-77', '1975-04-18', '{"rua": "Rua Augusta, 789", "cidade": "São Paulo", "cep": "01305-000"}'),
('Juliana Pereira', 'juliana.pereira@email.com', '$2b$10$rQZ8Kj9LmNpOqRsTvWxY3eFgHjKlMnBvCxZyAsDfGhJkLmNpOqRsT', 'paciente', '(11) 91111-1111', '888.888.888-88', '1995-09-05', '{"rua": "Rua Oscar Freire, 321", "cidade": "São Paulo", "cep": "01426-001"}');

-- Inserir horários de trabalho dos médicos
INSERT INTO horarios_trabalho (medico_id, dia_semana, hora_inicio, hora_fim) VALUES
-- Dr. João Silva (Cardiologia) - Segunda a Sexta
(1, 1, '08:00', '12:00'),
(1, 1, '14:00', '18:00'),
(1, 2, '08:00', '12:00'),
(1, 2, '14:00', '18:00'),
(1, 3, '08:00', '12:00'),
(1, 3, '14:00', '18:00'),
(1, 4, '08:00', '12:00'),
(1, 4, '14:00', '18:00'),
(1, 5, '08:00', '12:00'),
(1, 5, '14:00', '18:00'),

-- Dra. Maria Santos (Dermatologia) - Segunda, Quarta, Sexta
(2, 1, '09:00', '12:00'),
(2, 1, '14:00', '17:00'),
(2, 3, '09:00', '12:00'),
(2, 3, '14:00', '17:00'),
(2, 5, '09:00', '12:00'),
(2, 5, '14:00', '17:00'),

-- Dr. Pedro Costa (Ortopedia) - Terça e Quinta
(3, 2, '08:00', '12:00'),
(3, 2, '14:00', '18:00'),
(3, 4, '08:00', '12:00'),
(3, 4, '14:00', '18:00'),

-- Dra. Ana Oliveira (Pediatria) - Segunda a Sexta
(4, 1, '08:00', '12:00'),
(4, 1, '14:00', '17:00'),
(4, 2, '08:00', '12:00'),
(4, 2, '14:00', '17:00'),
(4, 3, '08:00', '12:00'),
(4, 3, '14:00', '17:00'),
(4, 4, '08:00', '12:00'),
(4, 4, '14:00', '17:00'),
(4, 5, '08:00', '12:00'),
(4, 5, '14:00', '17:00');

-- Inserir algumas consultas de exemplo
INSERT INTO consultas (paciente_id, medico_id, sala_id, data, hora_inicio, hora_fim, tipo_consulta, status, sintomas, urgencia, preco) VALUES
(6, 1, 1, CURRENT_DATE + INTERVAL '1 day', '09:00', '09:45', 'Consulta de Especialidade', 'agendada', 'Dor no peito e falta de ar', 4, 250.00),
(7, 2, 2, CURRENT_DATE + INTERVAL '2 days', '10:00', '10:30', 'Consulta Geral', 'agendada', 'Manchas na pele', 2, 200.00),
(8, 3, 3, CURRENT_DATE + INTERVAL '3 days', '15:00', '16:00', 'Consulta de Especialidade', 'agendada', 'Dor no joelho', 3, 300.00),
(9, 4, 4, CURRENT_DATE + INTERVAL '1 day', '11:00', '11:30', 'Consulta Geral', 'agendada', 'Check-up infantil', 1, 180.00);

-- Inserir algumas notificações de exemplo
INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem) VALUES
(6, 'agendamento', 'Consulta Agendada', 'Sua consulta com Dr. João Silva foi agendada para amanhã às 09:00'),
(7, 'agendamento', 'Consulta Agendada', 'Sua consulta com Dra. Maria Santos foi agendada para depois de amanhã às 10:00'),
(8, 'agendamento', 'Consulta Agendada', 'Sua consulta com Dr. Pedro Costa foi agendada para daqui a 3 dias às 15:00'),
(9, 'agendamento', 'Consulta Agendada', 'Sua consulta com Dra. Ana Oliveira foi agendada para amanhã às 11:00');
