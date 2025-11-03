# 🚀 Guia de Instalação e Execução - Sistema de Agendamento Médico

## 📋 Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn
- Git

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/MichelAlmeida1990/Gestor-de-Consulta-m-dica.git
cd Gestor-de-Consulta-m-dica
```

### 2. Instale as dependências

**Opção A - Instalação automática (recomendada):**
```bash
npm run install:all
```

**Opção B - Instalação manual:**
```bash
# Instalar dependências do projeto principal
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..

# Instalar dependências do frontend
cd frontend
npm install
cd ..
```

## ⚙️ Configuração

### Variáveis de Ambiente

**⚠️ IMPORTANTE:** Verifique se não há uma variável de ambiente PORT configurada no seu sistema que possa interferir na porta do backend.

Para verificar:
```bash
# Windows PowerShell
echo $env:PORT

# Windows CMD
echo %PORT%

# Linux/Mac
echo $PORT
```

Se a variável existir e não for a porta desejada, remova-a:
```bash
# Windows PowerShell
[Environment]::SetEnvironmentVariable("PORT", $null, "User")
[Environment]::SetEnvironmentVariable("PORT", $null, "Machine")

# Windows CMD
setx PORT ""

# Linux/Mac
unset PORT
```

### Configuração de Portas

O sistema usa as seguintes portas por padrão:
- **Backend:** Porta 3001 (ou porta definida em `PORT` se existir)
- **Frontend:** Porta 3002

Se você precisar alterar as portas:

1. **Backend:** Edite `backend/src/index.ts` linha 17:
```typescript
const PORT = process.env.PORT || 3001;
```

2. **Frontend:** Edite `frontend/vite.config.ts` linhas 14-18:
```typescript
server: {
  port: 3002,
  host: true,
  proxy: {
    '/api': {
      target: 'http://localhost:3001', // Altere se necessário
      changeOrigin: true,
      secure: false,
    },
  },
}
```

3. **Frontend API:** Edite `frontend/src/services/api.ts` linha 5:
```typescript
const API_BASE_URL = 'http://localhost:3001/api';
```

## ▶️ Executando o Sistema

### Iniciar Backend e Frontend Simultaneamente
```bash
npm run dev
```

Este comando irá:
- Iniciar o backend na porta 3001 (ou porta definida)
- Iniciar o frontend na porta 3002
- Auto-recargar quando houver mudanças nos arquivos

### Iniciar Separadamente

**Apenas Backend:**
```bash
npm run dev:backend
# ou
cd backend && npm run dev
```

**Apenas Frontend:**
```bash
npm run dev:frontend
# ou
cd frontend && npm run dev
```

## 🌐 Acessando o Sistema

Após iniciar, o sistema estará disponível em:

- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:3001 (ou porta configurada)
- **Health Check:** http://localhost:3001/api/health

## 🛠️ Solução de Problemas

### Erro: "Port already in use"

Se você receber um erro informando que a porta já está em uso:

**Windows:**
```bash
# Encontrar processo usando a porta
netstat -ano | findstr :3001

# Matar o processo (substitua PID pelo número do processo)
taskkill /F /PID <PID>

# Ou matar todos os processos Node
taskkill /F /IM node.exe
```

**Linux/Mac:**
```bash
# Encontrar processo usando a porta
lsof -i :3001

# Matar o processo
kill -9 <PID>

# Ou matar todos os processos Node
pkill node
```

### Backend iniciando na porta errada

Se o backend está iniciando em uma porta diferente de 3001:

1. Verifique se existe uma variável de ambiente PORT configurada:
```bash
echo $env:PORT  # Windows PowerShell
echo %PORT%     # Windows CMD
echo $PORT      # Linux/Mac
```

2. Se existir e for diferente de 3001, remova conforme instruções na seção "Configuração"

3. Reinicie o terminal e tente novamente

### Frontend não conecta ao Backend

1. Verifique se ambos os servidores estão rodando:
   - Backend deve mostrar: `🚀 Servidor rodando na porta XXXX`
   - Frontend deve mostrar: `VITE ready`

2. Verifique se as portas nos arquivos de configuração estão corretas:
   - `frontend/vite.config.ts` - proxy deve apontar para a porta correta do backend
   - `frontend/src/services/api.ts` - API_BASE_URL deve usar a porta correta

3. Verifique o console do navegador para erros de CORS ou conexão

### Banco de Dados não conecta

O sistema usa SQLite por padrão. Verifique:

1. Se o arquivo `backend/database/clinica.db` existe
2. Se há erros de permissão de escrita na pasta `backend/database`
3. Os logs do backend para mensagens de erro específicas

## 📦 Build de Produção

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🔍 Verificando se está tudo funcionando

1. **Teste o Backend:**
```bash
curl http://localhost:3001/api/health
```

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": ...,
  "environment": "production",
  "version": "2.0.0",
  "message": "Sistema funcionando com banco de dados real"
}
```

2. **Teste o Frontend:**
Abra http://localhost:3002 no navegador e verifique se a página carrega

3. **Teste o Login:**
- Acesse http://localhost:3002/login
- Use credenciais de teste (se disponíveis no seed.sql)

## 📝 Logs Importantes

**Backend iniciou corretamente:**
```
✅ Conectado ao banco de dados SQLite
✅ Schema do banco de dados criado
ℹ️ Dados já existem no banco
🚀 Servidor rodando na porta XXXX
```

**Frontend iniciou corretamente:**
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:3002/
```

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs no terminal
2. Confira a seção "Solução de Problemas" acima
3. Verifique se seguiu todas as etapas de configuração
4. Entre em contato: michelpaulo06@hotmail.com

## 🎯 Comandos Rápidos

```bash
# Instalar tudo
npm run install:all

# Iniciar desenvolvimento
npm run dev

# Parar servidores
Ctrl + C

# Limpar e reinstalar
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all

# Build de produção
npm run build
```

## ⚠️ Avisos Importantes

1. **Nunca commite arquivos `.env`** com credenciais reais
2. **Sempre teste localmente** antes de fazer deploy
3. **Faça backup** do banco de dados antes de migrações
4. **Mantenha as dependências atualizadas** regularmente
5. **Verifique as portas** se houver conflitos
