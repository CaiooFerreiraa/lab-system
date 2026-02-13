# Lab System - Agent Instructions

Este arquivo fornece um contexto técnico detalhado para IAs trabalharem no projeto Lab System de forma eficiente e alinhada com os padrões existentes.

## 🛠 Tech Stack
- **Frontend**: React (Vite), JavaScript (ES6+), Vanilla CSS.
- **Backend**: Node.js, Express, ES Modules.
- **Banco de Dados**: PostgreSQL (Neon Database) com o driver `@neondatabase/serverless`.
- **Autenticação**: JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`).
- **Infraestrutura**: Deploy no Render (Backend) e Vercel (Frontend).

## 📁 Arquitetura do Sistema

### Backend (`/server`)
Padrão Repository Pattern/MVC:
- **`config/database.js`**: Exporta a instância `db` do Neon.
- **`models/`**: Classes que estendem `BaseModel`. Tagged templates do Neon para SQL.
- **`controllers/`**: Classes com repositório injetado. Usam `asyncHandler`.
- **`routes/`**: Instanciam Models e Controllers (injeção manual).
- **`middlewares/`**: `error-handler.js`, validadores e `auth.middleware.js`.

### Frontend (`/client`)
- **`src/services/api.js`**: Fetch com JWT automático. Auto-logout ao receber 401.
- **`src/contexts/AuthContext.jsx`**: Estado global de autenticação (user, token, login, logout).
- **`src/components/auth/`**: `LoginPage.jsx`, `ProtectedRoute.jsx`, `UserManagement.jsx`.
- **`src/components/layout/Sidebar.jsx`**: Navegação com visibilidade por cargo e setor.

## 🔐 Sistema de Autenticação e RBAC

### Cargos (Roles)
| Cargo | Permissões |
|-------|-----------|
| `admin` | Acesso total. Cadastra qualquer role. Remove e altera cargos de usuários. |
| `moderator` | Cadastra apenas usuários `user`. Visualiza lista de usuários. NÃO pode deletar ou alterar cargos. |
| `user` | Sem acesso à administração. Visualiza abas baseado no seu setor. |

### Visibilidade por Setor (Frontend)
Configurada no mapa `SECTOR_VISIBILITY` em `Sidebar.jsx`:
- Admin: vê tudo, sempre.
- Sem setor definido: vê tudo (exceto admin-only).
- Com setor definido: vê apenas os grupos listados no mapa.

```javascript
// Exemplo de configuração em Sidebar.jsx:
const SECTOR_VISIBILITY = {
  "produção": ["main", "management", "quality"],
  "engenharia": ["main", "engineering", "quality"],
};
```

### Tabela `lab_system.usuario`
- `id` (serial PK)
- `email` (varchar unique)
- `senha` (varchar, hash bcrypt)
- `role` (varchar: 'admin', 'moderator', 'user')
- `fk_funcionario_matricula` (FK opcional → `funcionario`)
- `fk_cod_setor` (FK opcional → `setor`)

### Endpoints de Auth
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| POST | `/api/auth/login` | Público | Login, retorna JWT + user |
| GET | `/api/auth/me` | Autenticado | Dados do usuário logado |
| POST | `/api/auth/register` | Admin/Moderator | Cadastrar novo usuário |
| GET | `/api/auth/users` | Admin/Moderator | Listar todos os usuários |
| DELETE | `/api/auth/users/:id` | Admin | Remover um usuário |
| PUT | `/api/auth/users/:id/role` | Admin | Alterar role de um usuário |

### Middlewares
- `protect`: Valida JWT. Disponibiliza `req.user` (com `id`, `email`, `role`, `setor_id`, `setor_nome`).
- `authorize(...roles)`: Restringe acesso por cargo.

## 🚥 Padrões de Implementação

### Novo Recurso Backend
1. Migration em `/migrations/NNN_descricao.sql`.
2. Model em `models/` estendendo `BaseModel`.
3. Controller em `controllers/` usando `asyncHandler`.
4. Rotas em `routes/` + registrar no `routes/index.js`.

### Consultas ao Banco
Tagged templates com schema `lab_system`:
```javascript
await this.db`INSERT INTO lab_system.tabela (col) VALUES (${val})`;
```

### Frontend
- Use `useAuth()` para acessar dados do usuário logado.
- Novas rotas devem ser envolvidas com `<ProtectedRoute>`.
- Para restringir uma aba por cargo, adicione `requiredRoles` no grupo do `Sidebar.jsx`.

### Migrations
Ficam em `/migrations/` no formato `NNN_descricao.sql`. Rodar no SQL Editor do Neon.

## 📝 Notas
- `.env` contém `JWT_SECRET`, `DATABASE_URL`, `FRONTEND_URL`.
- `vite.config.js` tem proxy para todas as rotas da API (precisa reiniciar o Vite ao alterar).
- Rotas da API estão sob `/api` com fallback sem prefixo.
