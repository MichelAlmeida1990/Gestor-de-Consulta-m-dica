# 🔧 Correção dos Erros de Deploy

## ❌ Erro 1: Vercel - Secret não existe

**Erro:**
```
Environment Variable "VITE_API_BASE_URL" references Secret "api_base_url", which does not exist.
```

**Solução:**
1. No Vercel, vá em **Settings** → **Environment Variables**
2. Adicione manualmente:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://seu-backend.onrender.com/api` (use a URL do seu backend)
   - **Environment**: Todas (Production, Preview, Development)
3. Clique em **Save**
4. Faça um novo deploy

**OU** remova a linha do `vercel.json` que referencia o secret (já corrigido no código).

---

## ❌ Erro 2: Render - Arquivo não encontrado

**Erro:**
```
Error: Cannot find module '/opt/render/project/src/index.js'
```

**Causa:** O Render está tentando executar `node index.js` mas o arquivo compilado está em `dist/index.js`.

**Solução no Render:**

1. Vá nas **configurações do serviço** no Render
2. Verifique/Corrija:

   **Build Command:**
   ```
   npm install && npm run build
   ```
   ⚠️ Deve ter AMBOS os comandos!

   **Start Command:**
   ```
   npm start
   ```
   OU
   ```
   node dist/index.js
   ```
   ⚠️ NÃO use `node index.js`!

3. **Root Directory:**
   ```
   backend
   ```
   ⚠️ Deve ser `backend` (não `backend/src` ou vazio)

4. Salve e aguarde o redeploy

---

## ✅ Configuração Correta no Render

### Build & Deploy Settings:
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Variáveis de Ambiente:
```
NODE_ENV=production
PORT=3001
JWT_SECRET=466f670b86dad5176da19e1a06c4e2cb89ddb2a3cb08b07fade9abbf40290977
DATABASE_URL=./database/clinica.db
JWT_EXPIRES_IN=24h
CORS_ORIGINS=*
```

---

## 🔍 Verificações

### No Render:
- [ ] Root Directory = `backend`
- [ ] Build Command = `npm install && npm run build`
- [ ] Start Command = `npm start` (ou `node dist/index.js`)
- [ ] Todas as variáveis de ambiente configuradas

### No Vercel:
- [ ] Root Directory = `frontend`
- [ ] Build Command = `npm run build` (ou deixe vazio, Vercel detecta automaticamente)
- [ ] Output Directory = `dist`
- [ ] Variável `VITE_API_BASE_URL` adicionada manualmente nas Environment Variables

---

## 📝 Passo a Passo Rápido

### Render (Backend):
1. Settings → Build & Deploy
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Root Directory: `backend`
5. Salve e aguarde redeploy

### Vercel (Frontend):
1. Settings → Environment Variables
2. Adicione: `VITE_API_BASE_URL` = `https://seu-backend.onrender.com/api`
3. Deploy novamente

---

Após essas correções, ambos devem funcionar! 🚀

