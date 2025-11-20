# 🔧 Correção do Build no Render

## ❌ Problema Identificado

O Render está executando `npm install` no diretório errado, resultando em:
```
Could not find a declaration file for module 'express'
```

## ✅ Soluções Aplicadas

### 1. Ajuste no package.json
O script `build` agora inclui `npm install`:
```json
"build": "npm install && tsc"
```

### 2. Correção de tipos TypeScript
Adicionado tipo explícito para callback do CORS.

## 📋 Configuração Correta no Render

### Build & Deploy Settings:
- **Root Directory**: `backend` ⚠️ CRÍTICO!
- **Build Command**: `npm run build`
  - Agora o build já inclui `npm install`, então use apenas `npm run build`
- **Start Command**: `npm start`

### OU (Alternativa):

Se ainda der erro, use:
- **Build Command**: `npm install --production=false && npm run build`
- Isso garante que devDependencies sejam instaladas

## 🔍 Verificação

Após o deploy, verifique:
1. Logs devem mostrar: `npm install` executando no diretório `backend`
2. Logs devem mostrar: `tsc` compilando sem erros
3. Servidor deve iniciar com: `node dist/index.js`

## ⚠️ Se Ainda Der Erro

1. Verifique se **Root Directory** está como `backend` (não vazio)
2. Verifique se o **Build Command** está como `npm run build`
3. Verifique os logs completos do build no Render
4. Tente usar: `cd backend && npm install && npm run build` como Build Command

