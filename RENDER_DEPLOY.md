# 🚀 Guia de Deploy no Render - Passo a Passo

Este guia vai te ajudar a fazer deploy do backend no Render de forma simples e sem erros.

## 📋 Pré-requisitos

- ✅ Conta no GitHub (seu código já está lá)
- ✅ Conta no Render (crie em [render.com](https://render.com))
- ✅ Cartão de crédito (para verificação, não será cobrado no plano gratuito)

## 🎯 Passo a Passo Completo

### 1. Criar Conta no Render

1. Acesse [render.com](https://render.com)
2. Clique em **"Get Started for Free"**
3. Escolha **"Sign up with GitHub"** (mais fácil)
4. Autorize o Render a acessar seus repositórios

### 2. Criar Novo Web Service

1. No dashboard do Render, clique em **"New +"**
2. Selecione **"Web Service"**
3. Clique em **"Connect account"** se ainda não conectou o GitHub
4. Selecione o repositório: `Gestor-de-Consulta-m-dica`

### 3. Configurar o Serviço

Preencha os seguintes campos:

#### Informações Básicas:
- **Name**: `gestor-consulta-backend` (ou qualquer nome que preferir)
- **Region**: Escolha a região mais próxima (ex: `Oregon (US West)` ou `Frankfurt (EU Central)`)
- **Branch**: `main` (ou `master` se for o caso)
- **Root Directory**: `backend` ⚠️ **IMPORTANTE!**

#### Build & Deploy:
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 4. Configurar Variáveis de Ambiente

Clique em **"Advanced"** e depois em **"Add Environment Variable"**. Adicione uma por uma:

| Chave | Valor | Obrigatório |
|-------|-------|-------------|
| `NODE_ENV` | `production` | ✅ Sim |
| `PORT` | `3001` | ✅ Sim |
| `JWT_SECRET` | `[GERE_UMA_CHAVE_SEGURA]` | ✅ Sim |
| `DATABASE_URL` | `./database/clinica.db` | ✅ Sim |
| `JWT_EXPIRES_IN` | `24h` | ❌ Não |
| `CORS_ORIGINS` | `*` (permitir todas - configure depois) | ❌ Não |

#### 🔐 Gerar JWT_SECRET Seguro

Execute no terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use este gerador online: https://generate-secret.vercel.app/32

**Exemplo de JWT_SECRET gerado:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 5. Configurar Plano

- **Plan**: Escolha **"Free"** (plano gratuito)
- O plano gratuito inclui:
  - 750 horas/mês (suficiente para 24/7)
  - 512 MB RAM
  - 0.1 CPU

### 6. Deploy!

1. Clique em **"Create Web Service"**
2. O Render vai:
   - Clonar seu repositório
   - Instalar dependências
   - Executar o build
   - Iniciar o servidor
3. Aguarde alguns minutos (primeiro deploy pode levar 5-10 minutos)

### 7. Verificar se Funcionou

Após o deploy, você receberá uma URL como:
```
https://gestor-consulta-backend.onrender.com
```

Teste o endpoint de health:
```
https://gestor-consulta-backend.onrender.com/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## ⚠️ Problemas Comuns e Soluções

### Erro: "Build failed"

**Causa**: Comando de build incorreto ou dependências faltando

**Solução**:
- Verifique se o **Root Directory** está como `backend`
- Verifique se o **Build Command** está correto: `npm install && npm run build`
- Veja os logs no Render para mais detalhes

### Erro: "Application failed to respond"

**Causa**: Porta incorreta ou comando de start errado

**Solução**:
- Verifique se o **Start Command** está como `npm start`
- Verifique se a variável `PORT` está configurada (Render usa automaticamente, mas é bom ter)
- O Render expõe a porta através da variável `PORT` automaticamente

### Erro: "Database connection failed"

**Causa**: SQLite pode ter problemas com sistema de arquivos efêmero

**Solução**:
- O SQLite funciona no Render, mas os dados podem ser perdidos se o serviço reiniciar
- Para produção séria, considere migrar para PostgreSQL (Render oferece gratuitamente)

### Erro: "CORS blocked"

**Causa**: Frontend tentando acessar de origem não permitida

**Solução**:
- Adicione a URL do frontend na variável `CORS_ORIGINS`
- Exemplo: `https://seu-app.vercel.app,http://localhost:3002`

## 🔄 Atualizar Frontend

Após o deploy bem-sucedido, atualize o frontend:

1. No Vercel (ou onde estiver hospedado o frontend)
2. Adicione/atualize a variável de ambiente:
   ```
   VITE_API_BASE_URL=https://gestor-consulta-backend.onrender.com/api
   ```
3. Faça um novo deploy do frontend

## 📊 Monitoramento

No dashboard do Render você pode:
- Ver logs em tempo real
- Ver métricas de uso (CPU, RAM)
- Ver histórico de deploys
- Configurar auto-deploy (deploy automático quando fizer push no GitHub)

## 🔒 Segurança

- ✅ Nunca commite o arquivo `.env` no Git
- ✅ Use JWT_SECRET forte (mínimo 32 caracteres)
- ✅ Mantenha as variáveis de ambiente privadas no Render
- ✅ Use HTTPS sempre (Render fornece automaticamente)

## 💰 Custos

**Plano Gratuito:**
- ✅ 750 horas/mês (suficiente para 24/7)
- ✅ Deploy automático
- ✅ SSL/HTTPS grátis
- ✅ Logs e métricas

**Limitações:**
- ⚠️ Serviço "dorme" após 15 minutos de inatividade (primeira requisição pode demorar ~30s)
- ⚠️ Para evitar isso, pode usar um serviço de "ping" ou upgrade para plano pago ($7/mês)

## 🎉 Pronto!

Seu backend está no ar! Agora você pode:
- Testar todas as rotas da API
- Conectar o frontend
- Começar a usar o sistema em produção

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no Render
2. Teste localmente primeiro
3. Consulte a documentação: [render.com/docs](https://render.com/docs)

---

**Dica Pro**: Para evitar que o serviço "durma", você pode criar um cron job simples que faz uma requisição a cada 10 minutos, ou usar um serviço como [UptimeRobot](https://uptimerobot.com) (gratuito) para manter o serviço ativo.

