# 🎯 Ordem Correta de Deploy - Passo a Passo

## ⚠️ IMPORTANTE: Ordem de Deploy

Você está certo! Há uma dependência entre os dois deploys. A ordem correta é:

### 1️⃣ **BACKEND PRIMEIRO** (Render)
### 2️⃣ **FRONTEND DEPOIS** (Vercel)

---

## 📋 Passo a Passo Completo

### **ETAPA 1: Deploy do Backend no Render** 🚀

1. **Acesse [render.com](https://render.com)** e faça login

2. **Crie um novo Web Service:**
   - Clique em "New +" → "Web Service"
   - Conecte o repositório `Gestor-de-Consulta-m-dica`
   - Configure:
     - **Name**: `gestor-consulta-backend`
     - **Root Directory**: `backend` ⚠️
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: `Free`

3. **Adicione as variáveis de ambiente:**
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=466f670b86dad5176da19e1a06c4e2cb89ddb2a3cb08b07fade9abbf40290977
   DATABASE_URL=./database/clinica.db
   JWT_EXPIRES_IN=24h
   CORS_ORIGINS=*
   ```
   ⚠️ **CORS_ORIGINS=*** permite todas as origens temporariamente. Você vai ajustar depois.

4. **Clique em "Create Web Service"** e aguarde o deploy (5-10 minutos)

5. **Anote a URL do backend** que o Render vai gerar:
   ```
   https://gestor-consulta-backend.onrender.com
   ```
   📝 **GUARDE ESTA URL!** Você vai precisar dela no próximo passo.

6. **Teste se funcionou:**
   - Acesse: `https://gestor-consulta-backend.onrender.com/api/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

---

### **ETAPA 2: Deploy do Frontend no Vercel** 🎨

Agora que o backend está no ar, vamos fazer o deploy do frontend:

1. **Acesse [vercel.com](https://vercel.com)** e faça login com GitHub

2. **Importe o repositório:**
   - Clique em "Add New..." → "Project"
   - Selecione o repositório `Gestor-de-Consulta-m-dica`
   - Configure:
     - **Framework Preset**: `Vite`
     - **Root Directory**: `frontend` ⚠️
     - **Build Command**: `npm run build` (já vem preenchido)
     - **Output Directory**: `dist` (já vem preenchido)

3. **Adicione a variável de ambiente:**
   - Clique em "Environment Variables"
   - Adicione:
     ```
     Nome: VITE_API_BASE_URL
     Valor: https://gestor-consulta-backend.onrender.com/api
     ```
   ⚠️ **Use a URL do backend que você anotou no passo anterior!**

4. **Clique em "Deploy"** e aguarde (2-5 minutos)

5. **Anote a URL do frontend** que o Vercel vai gerar:
   ```
   https://gestor-de-consulta-medica.vercel.app
   ```
   (ou similar, depende do nome do projeto)

---

### **ETAPA 3: Ajustar CORS no Backend** 🔒

Agora que você tem a URL do frontend, vamos ajustar o CORS:

1. **No Render**, vá nas configurações do seu serviço backend

2. **Edite a variável de ambiente `CORS_ORIGINS`:**
   - Remova: `CORS_ORIGINS=*`
   - Adicione:
     ```
     CORS_ORIGINS=https://gestor-de-consulta-medica.vercel.app,http://localhost:3002
     ```
   ⚠️ **Substitua pela URL real do seu frontend no Vercel!**

3. **Salve** - o Render vai fazer um redeploy automático

---

## ✅ Resumo da Ordem

```
1. Backend no Render
   ↓
2. Pegar URL do backend
   ↓
3. Frontend no Vercel (com URL do backend)
   ↓
4. Pegar URL do frontend
   ↓
5. Atualizar CORS no backend (com URL do frontend)
```

---

## 🎯 Variáveis de Ambiente - Resumo

### **Backend (Render):**
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=466f670b86dad5176da19e1a06c4e2cb89ddb2a3cb08b07fade9abbf40290977
DATABASE_URL=./database/clinica.db
JWT_EXPIRES_IN=24h
CORS_ORIGINS=*  # Depois trocar pela URL do frontend
```

### **Frontend (Vercel):**
```env
VITE_API_BASE_URL=https://gestor-consulta-backend.onrender.com/api
# ↑ Use a URL do seu backend aqui!
```

---

## 🆘 Se Algo Der Errado

### Backend não funciona:
- Verifique os logs no Render
- Confirme que Root Directory = `backend`
- Teste: `https://seu-backend.onrender.com/api/health`

### Frontend não conecta ao backend:
- Verifique se `VITE_API_BASE_URL` está correto
- Confirme que a URL termina com `/api`
- Verifique o console do navegador para erros de CORS

### Erro de CORS:
- Confirme que `CORS_ORIGINS` no backend inclui a URL do frontend
- Aguarde o redeploy do backend após mudar CORS_ORIGINS

---

## 📝 Checklist Final

- [ ] Backend deployado no Render ✅
- [ ] URL do backend anotada ✅
- [ ] Backend respondendo em `/api/health` ✅
- [ ] Frontend deployado no Vercel ✅
- [ ] `VITE_API_BASE_URL` configurado com URL do backend ✅
- [ ] URL do frontend anotada ✅
- [ ] `CORS_ORIGINS` atualizado no backend com URL do frontend ✅
- [ ] Sistema funcionando! 🎉

---

**Dica**: Você pode fazer o deploy do backend primeiro e testar localmente o frontend apontando para o backend no Render. Depois faz o deploy do frontend!

