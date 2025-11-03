# ⚡ Início Rápido - Sistema de Agendamento Médico

## 🚀 3 Passos para Começar

### 1️⃣ Clone e Entre no Projeto
```bash
git clone https://github.com/MichelAlmeida1990/Gestor-de-Consulta-m-dica.git
cd Gestor-de-Consulta-m-dica
```

### 2️⃣ Instale as Dependências
```bash
npm run install:all
```

### 3️⃣ Inicie o Sistema
```bash
npm run dev
```

## ✅ Pronto!

Acesse: **http://localhost:3002**

---

## ❌ Problemas?

### Backend na porta errada?

**1. Verifique se há variável PORT:**
```bash
# Windows PowerShell
echo $env:PORT
```

**2. Se existir, remova:**
```bash
# Windows PowerShell
[Environment]::SetEnvironmentVariable("PORT", $null, "User")
[Environment]::SetEnvironmentVariable("PORT", $null, "Machine")

# Feche e reabra o terminal, depois:
npm run dev
```

### Porta já em uso?

**Mata todos os processos Node:**
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill node
```

Depois execute novamente:
```bash
npm run dev
```

---

## 📖 Precisa de Mais Ajuda?

- **[INSTALL.md](INSTALL.md)** - Guia Completo
- **[README.md](README.md)** - Documentação do Projeto

---

## 🎯 Comandos Úteis

```bash
# Iniciar tudo
npm run dev

# Apenas backend
npm run dev:backend

# Apenas frontend
npm run dev:frontend

# Parar
Ctrl + C

# Reinstalar tudo
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

**Boa sorte! 🍀**
