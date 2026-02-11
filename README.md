# 🔬 Lab System

Sistema de gerenciamento laboratorial completo para controle de funcionários, marcas, modelos, produtos, setores e testes.

## 📁 Estrutura do Projeto

```
lab_system/
├── server/              # Backend (Express + Neon PostgreSQL)
│   ├── config/          # Configuração do banco de dados
│   ├── controllers/     # Controladores (lógica HTTP)
│   ├── middlewares/     # Error handler, validadores
│   ├── models/          # Modelos (acesso ao banco)
│   ├── routes/          # Definição de rotas da API
│   └── server.js        # Entry point do servidor
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # Componentes React por domínio
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # Camada de API centralizada
│   │   └── index.css    # Design system CSS premium
│   ├── index.html
│   └── vite.config.js
├── .env                 # Variáveis de ambiente (não comitado)
└── package.json         # Scripts do monorepo
```

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- PostgreSQL (Neon Serverless)

### Instalação

```bash
# Instala dependências do backend E frontend
npm install
```

### Desenvolvimento

```bash
# Terminal 1 — Backend (porta 5000)
npm run dev

# Terminal 2 — Frontend (porta 5173)
npm run dev:client
```

### Produção

```bash
# Build do frontend
npm run build:client

# Iniciar servidor (serve API + frontend estático)
npm start
```

## 🛠 Tecnologias

| Camada     | Tecnologia                |
|------------|---------------------------|
| Backend    | Express 5, Node.js (ESM)  |
| Banco      | PostgreSQL (Neon Serverless) |
| Frontend   | React 19, React Router 7  |
| Build      | Vite 6                    |
| Styling    | Vanilla CSS (Dark Theme)  |

## 📡 Endpoints da API

| Entidade     | Rota Base          | Operações                |
|--------------|--------------------|--------------------------|
| Funcionários | `/employee`        | CRUD completo            |
| Marcas       | `/mark`            | CRUD + métodos           |
| Modelos      | `/model`           | CRUD + especificações    |
| Produtos     | `/product`         | CRUD + busca por setor   |
| Setores      | `/sector`          | CRUD + listagem materiais |
| Testes       | `/test`            | Criar, listar, excluir   |
| Enums        | `/enum`            | Listar status e tipos    |

## 🏗 Arquitetura

### Backend
```
Routes → Validators (middlewares) → Controllers → Models → Database (Neon)
```

- **asyncHandler**: Wrapper que captura erros async e delega ao error handler central
- **AppError**: Classe de erro customizada com status HTTP  
- **BaseModel**: Classe abstrata que todos os models estendem

### Frontend
- **Design responsivo** unificado (sem separação desktop/mobile)
- **Sidebar colapsável** com navegação por módulo
- **Camada de API centralizada** (`services/api.js`) 
- **Dark theme premium** com micro-animações e glassmorphism
