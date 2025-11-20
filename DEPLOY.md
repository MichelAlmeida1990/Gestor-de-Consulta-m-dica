# Guia de Deploy - Vercel

Este documento descreve como fazer deploy do frontend na Vercel.

## Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Repositório no GitHub conectado à Vercel

## Configuração do Deploy

### 1. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente na Vercel:

- `VITE_API_BASE_URL`: URL da API backend (ex: `https://seu-backend.herokuapp.com/api`)

### 2. Configurações do Projeto na Vercel

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Deploy Automático

O deploy automático está configurado através do arquivo `vercel.json`. 

Quando você fizer push para a branch `main`, a Vercel automaticamente:
1. Instala as dependências
2. Executa o build
3. Faz deploy da aplicação

## Estrutura do Projeto

```
Gestor-de-Consulta-m-dica/
├── frontend/          # Frontend React + Vite
│   ├── dist/         # Build output (gerado)
│   └── ...
├── backend/          # Backend Node.js + Express
│   └── ...
└── vercel.json       # Configuração do Vercel
```

## Notas Importantes

- O backend precisa estar hospedado separadamente (Heroku, Railway, Render, etc.)
- Certifique-se de que a URL da API está configurada corretamente nas variáveis de ambiente
- O CORS do backend deve permitir requisições do domínio da Vercel

## Comandos Úteis

```bash
# Build local para testar
cd frontend
npm run build

# Verificar lint
npm run lint

# Corrigir problemas de lint automaticamente
npm run lint:fix
```

