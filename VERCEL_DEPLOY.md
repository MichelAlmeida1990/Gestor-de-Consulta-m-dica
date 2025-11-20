# 🚀 Guia de Deploy do Frontend no Vercel

Este guia vai te ajudar a fazer deploy do frontend no Vercel de forma simples e rápida.

## 📋 Pré-requisitos

- ✅ Backend já deployado no Render (você já tem! 🎉)
- ✅ URL do backend no Render (ex: `https://gestor-consulta-backend.onrender.com`)
- ✅ Conta no Vercel (crie em [vercel.com](https://vercel.com))

## 🎯 Passo a Passo Completo

### 1. Criar Conta no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"** (mais fácil)
4. Autorize o Vercel a acessar seus repositórios

### 2. Importar Projeto

1. No dashboard do Vercel, clique em **"Add New..."**
2. Selecione **"Project"**
3. Clique em **"Import Git Repository"**
4. Selecione o repositório: `Gestor-de-Consulta-m-dica`
5. Clique em **"Import"**

### 3. Configurar o Projeto

Preencha os seguintes campos:

#### Informações Básicas:
- **Project Name**: `gestor-consulta-frontend` (ou qualquer nome)
- **Framework Preset**: `Vite` (deve detectar automaticamente)
- **Root Directory**: `frontend` ⚠️ **IMPORTANTE!**

#### Build Settings:
- **Build Command**: `npm run build` (já vem preenchido)
- **Output Directory**: `dist` (já vem preenchido)
- **Install Command**: `npm install` (já vem preenchido)

### 4. Configurar Variáveis de Ambiente

⚠️ **CRÍTICO**: Adicione esta variável antes de fazer deploy!

1. Clique em **"Environment Variables"**
2. Adicione:
   ```
   Nome: VITE_API_BASE_URL
   Valor: https://gestor-consulta-backend.onrender.com/api
   ```
   ⚠️ **Substitua pela URL real do seu backend no Render!**

3. Selecione os ambientes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Clique em **"Save"**

### 5. Deploy!

1. Clique em **"Deploy"**
2. Aguarde alguns minutos (2-5 minutos normalmente)
3. O Vercel vai:
   - Instalar dependências
   - Executar o build
   - Fazer deploy da aplicação

### 6. Verificar se Funcionou

Após o deploy, você receberá uma URL como:
```
https://gestor-consulta-frontend.vercel.app
```

Teste:
1. Acesse a URL
2. Tente fazer login
3. Verifique se conecta com o backend

## ⚠️ Problemas Comuns e Soluções

### Erro: "Build failed"

**Causa**: Root Directory incorreto ou variáveis de ambiente faltando

**Solução**:
- Verifique se **Root Directory** está como `frontend`
- Verifique se `VITE_API_BASE_URL` está configurada
- Veja os logs do build para mais detalhes

### Erro: "Cannot connect to backend"

**Causa**: URL do backend incorreta ou CORS não configurado

**Solução**:
1. Verifique se `VITE_API_BASE_URL` está correta
2. Verifique se termina com `/api`
3. No Render, atualize `CORS_ORIGINS` com a URL do Vercel:
   ```
   CORS_ORIGINS=https://gestor-consulta-frontend.vercel.app,http://localhost:3002
   ```

### Erro: "White screen"

**Causa**: Erro no build ou variável de ambiente não encontrada

**Solução**:
- Verifique os logs do build no Vercel
- Confirme que `VITE_API_BASE_URL` está configurada
- Teste localmente primeiro: `npm run build`

## 🔄 Atualizar CORS no Backend

Após o deploy do frontend, atualize o CORS no Render:

1. No Render, vá nas configurações do backend
2. Edite a variável `CORS_ORIGINS`:
   ```
   https://gestor-consulta-frontend.vercel.app,http://localhost:3002
   ```
   ⚠️ **Substitua pela URL real do seu frontend no Vercel!**

3. Salve - o Render vai fazer redeploy automático

## 📊 Monitoramento

No dashboard do Vercel você pode:
- Ver logs em tempo real
- Ver métricas de uso
- Ver histórico de deploys
- Configurar domínio customizado (opcional)

## 🔒 Segurança

- ✅ Variáveis de ambiente são privadas no Vercel
- ✅ HTTPS automático
- ✅ Deploy automático quando fizer push no GitHub

## 💰 Custos

**Plano Gratuito:**
- ✅ Deploy ilimitado
- ✅ Domínio `.vercel.app` grátis
- ✅ SSL/HTTPS grátis
- ✅ Bandwidth generoso

## 🎉 Pronto!

Seu frontend está no ar! Agora você pode:
- Acessar o sistema pela URL do Vercel
- Fazer login e usar todas as funcionalidades
- O sistema está completo e funcionando! 🚀

## 📝 Checklist Final

- [ ] Conta no Vercel criada ✅
- [ ] Projeto importado do GitHub ✅
- [ ] Root Directory = `frontend` ✅
- [ ] Variável `VITE_API_BASE_URL` configurada ✅
- [ ] Deploy realizado ✅
- [ ] Frontend acessível pela URL do Vercel ✅
- [ ] CORS atualizado no backend com URL do Vercel ✅
- [ ] Login funcionando ✅
- [ ] Sistema completo funcionando! 🎉

---

**Dica**: O Vercel faz deploy automático sempre que você fizer push na branch `main`. Muito prático! 🚀

