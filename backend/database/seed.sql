-- Sistema de Agendamento Médico - Usuário Admin Inicial
-- Criado em: 2025-10-28

-- Inserir usuário administrador inicial para testes
INSERT INTO usuarios (nome, email, senha, tipo, telefone, cpf, data_nascimento, endereco) VALUES
('Administrador Sistema', 'admin@clinica.com', '$2b$10$XBuqIR77asrgr6xicvp3xOII2cIgefR9nHMUPFu/5hCyUA0vtQO/S', 'admin', '(11) 99999-9999', '000.000.000-00', '1980-01-01', 'Rua Administração, 1 - Centro');

-- Senha: 123456 (hash bcrypt)

-- Inserir salas iniciais
INSERT INTO salas (nome, numero, andar, equipamentos, capacidade, ativa) VALUES
('Sala 01 - Consulta Geral', '01', 1, 'Mesa de exame, Equipamentos básicos', 1, 1),
('Sala 02 - Cardiologia', '02', 1, 'Eletrocardiograma, Monitor cardíaco', 1, 1),
('Sala 03 - Ortopedia', '03', 1, 'Raio-X portátil, Mesa ortopédica', 1, 1),
('Sala 04 - Pediatria', '04', 2, 'Equipamentos infantis, Mesa de exame ajustável', 1, 1),
('Sala 05 - Dermatologia', '05', 2, 'Lupa dermatológica, Equipamentos de biópsia', 1, 1),
('Sala 06 - Ginecologia', '06', 2, 'Mesa ginecológica, Ultrassom', 1, 1),
('Sala 07 - Psicologia', '07', 3, 'Ambiente acolhedor, Sala de espera', 1, 1),
('Sala 08 - Oftalmologia', '08', 3, 'Equipamentos oftalmológicos, Lâmpada de fenda', 1, 1),
('Sala 09 - Otorrinolaringologia', '09', 3, 'Equipamentos ORL, Endoscópio', 1, 1),
('Sala 10 - Reunião', '10', 1, 'Projetor, Mesa de reunião', 10, 1);