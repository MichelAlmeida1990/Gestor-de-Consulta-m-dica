# 🏥 Sistema de Agendamento Médico - ClínicaMed

Sistema completo de agendamento de consultas médicas com funcionalidades avançadas de gestão de médicos, pacientes, salas e notificações.

## 🚀 Funcionalidades

### 📋 Gestão de Médicos
- ✅ Cadastro completo de médicos com CRM, especialidade e contatos
- ✅ Ativação/desativação de médicos
- ✅ Filtros por especialidade e status
- ✅ Busca por nome, CRM ou email

### 📅 Sistema de Agendamento
- ✅ Agendamento inteligente com algoritmo de priorização
- ✅ Verificação de disponibilidade de médicos e salas
- ✅ Resolução automática de conflitos
- ✅ Sugestões de horários alternativos

### 👥 Gestão de Consultas
- ✅ Listagem de consultas com filtros avançados
- ✅ Confirmação e cancelamento de consultas
- ✅ Histórico completo de consultas
- ✅ Status em tempo real

### 🔔 Sistema de Notificações
- ✅ Notificações em tempo real
- ✅ Lembretes de consultas
- ✅ Alertas de conflitos
- ✅ Notificações de cancelamento

### 🏢 Gestão de Salas
- ✅ Cadastro e gestão de salas de consulta
- ✅ Verificação de disponibilidade
- ✅ Equipamentos por sala

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **React Query** para gerenciamento de estado
- **React Hook Form** para formulários
- **React Router DOM** para navegação
- **Lucide React** para ícones
- **React Hot Toast** para notificações

### Backend
- **Node.js** com TypeScript
- **Express.js** para API REST
- **Prisma ORM** para banco de dados
- **PostgreSQL** como banco principal
- **JWT** para autenticação
- **Joi** para validação de dados

### Banco de Dados
- **PostgreSQL** com schema otimizado
- **Prisma** como ORM
- **Migrações** automáticas

## 📦 Instalação Rápida

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/MichelAlmeida1990/Gestor-de-Consulta-m-dica.git
cd Gestor-de-Consulta-m-dica

# 2. Instale todas as dependências
npm run install:all

# 3. Execute o sistema
npm run dev
```

O sistema estará disponível em:
- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:3001

### ⚠️ Problemas com Portas?

Se o backend iniciar na porta errada, verifique a variável de ambiente PORT:
```bash
# Windows PowerShell
echo $env:PORT

# Se existir, remova:
[Environment]::SetEnvironmentVariable("PORT", $null, "User")

# Depois reinicie o terminal e execute:
npm run dev
```

## 📚 Documentação Completa

Para instruções detalhadas, solução de problemas e configuração avançada, consulte:
👉 **[INSTALL.md](INSTALL.md)** - Guia Completo de Instalação

## 🎨 Paleta de Cores

- **Azul Principal**: #031f5f
- **Azure Vívido**: #00afee
- **Rosa Neon**: #ca00ca
- **Marrom**: #c2af00
- **Verde Botão**: #ccff00
- **Preto Fundo**: #000000

## 📊 Estrutura do Projeto

```
Sistema Agendamento de Consulta/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares
│   │   ├── types/          # Tipos TypeScript
│   │   └── index.ts        # Servidor principal
│   ├── prisma/             # Schema do banco
│   └── package.json
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços de API
│   │   ├── contexts/       # Contextos React
│   │   └── types/          # Tipos TypeScript
│   └── package.json
├── database/               # Scripts SQL
│   ├── schema.sql          # Schema do banco
│   └── seed.sql            # Dados iniciais
└── package.json            # Scripts principais
```

## 🔧 Scripts Disponíveis

### Projeto Principal
- `npm run dev` - Executa backend e frontend simultaneamente
- `npm run backend` - Executa apenas o backend
- `npm run frontend` - Executa apenas o frontend

### Backend
- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila TypeScript
- `npm run start` - Executa versão compilada

### Frontend
- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build

## 🚀 Deploy

### Frontend (Vercel)
1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Backend (Railway/Render)
1. Conecte o repositório
2. Configure PostgreSQL
3. Configure variáveis de ambiente
4. Deploy automático

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Desenvolvedor

**Michel Paulo Almeida**
- GitHub: [@MichelAlmeida1990](https://github.com/MichelAlmeida1990)
- Email: michelpaulo06@hotmail.com

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, envie um email para michelpaulo06@hotmail.com ou abra uma issue no GitHub.

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela!** ⭐