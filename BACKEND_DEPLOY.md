# Guia de Deploy do Backend

Este documento descreve as melhores opções para hospedar o backend do Sistema de Agendamento Médico.

## 🏆 Recomendações (em ordem de preferência)

### 1. **Railway** ⭐ RECOMENDADO
**Por quê:**
- ✅ Setup extremamente simples
- ✅ Suporta SQLite nativamente
- ✅ Deploy automático via GitHub
- ✅ Plano gratuito generoso
- ✅ SSL automático
- ✅ Variáveis de ambiente fáceis de configurar
- ✅ Logs em tempo real

**Como fazer deploy:**
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project" → "Deploy from GitHub repo"
4. Selecione o repositório
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Adicione variáveis de ambiente:
   ```
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=sua_chave_secreta_forte_aqui
   DATABASE_URL=./database/clinica.db
   ```
7. Deploy automático! 🚀

**URL será**: `https://seu-projeto.up.railway.app`

---

### 2. **Render** ⭐ ALTERNATIVA EXCELENTE
**Por quê:**
- ✅ Plano gratuito disponível
- ✅ Deploy automático via GitHub
- ✅ SSL automático
- ✅ Fácil configuração
- ⚠️ Para SQLite, precisa configurar volume persistente (plano pago)

**Como fazer deploy:**
1. Acesse [render.com](https://render.com)
2. Faça login com GitHub
3. Clique em "New" → "Web Service"
4. Conecte o repositório
5. Configure:
   - **Name**: `gestor-consulta-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Adicione variáveis de ambiente
7. Deploy!

**URL será**: `https://gestor-consulta-backend.onrender.com`

---

### 3. **Fly.io** ⭐ BOA PARA APPS PEQUENOS
**Por quê:**
- ✅ Muito rápido
- ✅ Suporta SQLite
- ✅ Plano gratuito
- ✅ Deploy via CLI ou GitHub

**Como fazer deploy:**
1. Instale o Fly CLI: `npm install -g @fly/cli`
2. Faça login: `fly auth login`
3. No diretório `backend`, execute: `fly launch`
4. Siga as instruções
5. Configure variáveis: `fly secrets set JWT_SECRET=sua_chave`

**URL será**: `https://seu-projeto.fly.dev`

---

### 4. **DigitalOcean App Platform**
**Por quê:**
- ✅ Confiável e estável
- ✅ Boa documentação
- ⚠️ Requer cartão de crédito (mesmo no plano básico)
- ⚠️ Melhor com PostgreSQL

**Como fazer deploy:**
1. Acesse [digitalocean.com](https://www.digitalocean.com)
2. Crie um App
3. Conecte GitHub
4. Configure build e start commands
5. Adicione variáveis de ambiente

---

## 📋 Variáveis de Ambiente Necessárias

Independente da plataforma escolhida, configure estas variáveis:

```env
# Obrigatórias
PORT=3001
NODE_ENV=production
JWT_SECRET=sua_chave_secreta_super_forte_aqui_minimo_32_caracteres
DATABASE_URL=./database/clinica.db

# Opcionais
JWT_EXPIRES_IN=24h
CORS_ORIGINS=https://seu-frontend.vercel.app,http://localhost:3002
CLINICA_NOME=Sua Clínica
CLINICA_EMAIL=contato@clinica.com
```

## 🔐 Gerando JWT_SECRET Seguro

Execute no terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use um gerador online: https://generate-secret.vercel.app/32

## 📝 Checklist de Deploy

- [ ] Criar conta na plataforma escolhida
- [ ] Conectar repositório GitHub
- [ ] Configurar root directory como `backend`
- [ ] Configurar build command: `npm install && npm run build`
- [ ] Configurar start command: `npm start`
- [ ] Adicionar todas as variáveis de ambiente
- [ ] Testar endpoint: `https://seu-backend.com/api/health`
- [ ] Atualizar `VITE_API_BASE_URL` no frontend com a URL do backend

## ⚠️ Importante: SQLite em Produção

**SQLite funciona bem para:**
- ✅ Aplicações pequenas/médias
- ✅ Menos de 100 requisições simultâneas
- ✅ Dados que não precisam de alta disponibilidade

**Para produção em escala, considere migrar para:**
- PostgreSQL (Railway, Render, Supabase)
- MySQL (PlanetScale)
- MongoDB Atlas

## 🔄 Migração para PostgreSQL (Opcional)

Se quiser usar PostgreSQL no Railway:

1. No Railway, adicione um serviço PostgreSQL
2. Railway fornecerá automaticamente a variável `DATABASE_URL`
3. Atualize o código para usar PostgreSQL em vez de SQLite
4. Execute as migrations

## 📚 Links Úteis

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
- [DigitalOcean Docs](https://docs.digitalocean.com)

---

## 🎯 Recomendação Final

**Para começar rapidamente**: Use **Railway**
- Mais fácil de configurar
- Suporta SQLite nativamente
- Deploy em minutos
- Plano gratuito generoso

**Para produção séria**: Use **Railway com PostgreSQL**
- Mais robusto
- Melhor performance
- Escalável

