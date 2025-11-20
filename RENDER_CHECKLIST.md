# ✅ Checklist Rápido - Deploy no Render

## Antes de Começar

- [ ] Conta no Render criada
- [ ] Repositório no GitHub atualizado
- [ ] JWT_SECRET gerado (execute: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

## Configurações no Render

### Informações Básicas
- [ ] **Name**: `gestor-consulta-backend`
- [ ] **Region**: Escolha a mais próxima
- [ ] **Branch**: `main`
- [ ] **Root Directory**: `backend` ⚠️ **CRÍTICO!**

### Build & Deploy
- [ ] **Runtime**: `Node`
- [ ] **Build Command**: `npm install && npm run build`
- [ ] **Start Command**: `npm start`
- [ ] **Plan**: `Free`

### Variáveis de Ambiente (Adicione todas!)

```
NODE_ENV=production
PORT=3001
JWT_SECRET=[COLE_AQUI_O_JWT_SECRET_GERADO]
DATABASE_URL=./database/clinica.db
JWT_EXPIRES_IN=24h
```

## Após o Deploy

- [ ] Teste: `https://seu-backend.onrender.com/api/health`
- [ ] Deve retornar: `{"status":"ok","timestamp":"..."}`
- [ ] Anote a URL do backend
- [ ] Atualize `VITE_API_BASE_URL` no frontend (Vercel)

## ⚠️ Importante

1. **Root Directory DEVE ser `backend`** - sem isso o deploy falha!
2. **JWT_SECRET** deve ser forte (32+ caracteres)
3. Primeiro deploy pode levar 5-10 minutos
4. Serviço gratuito "dorme" após 15min de inatividade

## 🆘 Se Der Erro

1. Verifique os logs no Render
2. Confirme que Root Directory = `backend`
3. Confirme que Build Command está correto
4. Confirme que Start Command = `npm start`

## 📝 URL do Backend

Após deploy bem-sucedido, sua URL será:
```
https://gestor-consulta-backend.onrender.com
```

Use esta URL no frontend:
```
VITE_API_BASE_URL=https://gestor-consulta-backend.onrender.com/api
```

