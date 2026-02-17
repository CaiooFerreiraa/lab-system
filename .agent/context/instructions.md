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

### Visibilidade e Controle por Setor (Frontend)
Configurada no mapa `SECTOR_VISIBILITY` em `Sidebar.jsx`:
- **Admin/Laboratório**: Vê tudo e pode alterar o "Setor do Produto" nos registros.
- **Outros Setores**: Visibilidade restrita. O campo "Setor do Produto" no registro é bloqueado (read-only) para o setor do usuário logado.

### Lógica de Fallback de Setor (Backend)
O servidor possui uma camada de segurança para garantir a gravação correta do `fk_cod_setor`:
1. Se o frontend o enviar, ele é validado.
2. Se estiver ausente, o backend busca o setor vinculado à `fk_funcionario_matricula` ou ao `req.user` decodificado do token.

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
- `protect`: Valida JWT. Disponibiliza `req.user` com:
  - `id`: ID do usuário.
  - `email`: Email acadêmico/profissional.
  - `role`: Cargo (admin/moderator/user).
  - `fk_cod_setor`: ID do setor do usuário.
  - `setor_nome`: Nome do setor do usuário.
  - `fk_funcionario_matricula`: Matrícula do funcionário vinculado.
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

### Tabelas Adicionais

#### `lab_system.modelo`
- `cod_modelo` (serial PK)
- `nome` (varchar)
- `tipo` (varchar)
- `cod_marca` (FK -> `marca`)
- `fk_msc_id` (FK -> `msc` - Legado)
- `fk_msc_id_bn` (FK -> `msc` - Novo)
- `fk_msc_id_dn` (FK -> `msc` - Novo)

#### `lab_system.descolagem`
- Armazena metadados extraídos de laudos técnicos (PDF).
- Vinculada ao `laudo` (FK `fk_laudo_id`).
- Campos extraídos: `adesivo`, `adesivo_fornecedor`, `valor_media`, `esteira`, etc.

### Regras de Negócio Importantes
1. **Registro de Testes**: Se `fk_material` não for fornecido, o sistema aplica um fallback:
   - Modo Descolagem: Usa o `numero_pedido` ou gera um ID único prefixado.
   - Outros: Usa a constante "AVULSO".
2. **Navegação pós-sucesso**: No `TestRegister.jsx`, o redirecionamento automático é desativado após o sucesso para permitir a visualização do card de resultados.
3. **Persistência de Setor**: O campo `fk_cod_setor` em `teste` e `material` é obrigatório (`NOT NULL`).

CREATE SCHEMA "neon_auth";
CREATE SCHEMA "lab_system";
CREATE TYPE "lab_system"."tipo_enum" AS ENUM('DUREZA', 'DENSIDADE', 'RESILIENCIA', 'ENCOLHIMENTO', 'COMPRESSION SET', 'RASGAMENTO', 'ALONGAMENTO_TRACAO', 'ABRASAO DIN', 'ABRASAO AKRON', 'MODULO 300%', 'TEOR DE GEIS', 'TEOR DE UMIDADE_DE_SILICA', 'UMIDADE DE EVA', 'VOLUME DE GAS', 'BLOOMING', 'ENVELHECIMENTO', 'HIDROLISE', 'DESCOLAGEM', 'RESISTENCIA A LAVAGEM');
CREATE TYPE "lab_system"."modelo_tipo" AS ENUM('Casual', 'Esportivo', 'Alta Performance');
CREATE TYPE "lab_system"."turno_enum" AS ENUM('Turno A', 'Turno B', 'Turno C');
CREATE TYPE "lab_system"."type_material" AS ENUM('BN', 'DN', 'Base');
CREATE TYPE "lab_system"."status_enum" AS ENUM('Concluído', 'Pendente', 'Em Andamento', 'Aprovado', 'Reprovado');
CREATE TYPE "lab_system"."setor_enum" AS ENUM('Borracha', 'Injetado', 'Protótipo', 'Almoxarifado', 'Pré-Fabricado', 'Químico');
CREATE TABLE "neon_auth"."account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" uuid NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizationId" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"inviterId" uuid NOT NULL
);
CREATE TABLE "neon_auth"."jwks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"expiresAt" timestamp with time zone
);
CREATE TABLE "neon_auth"."member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL CONSTRAINT "organization_slug_key" UNIQUE,
	"logo" text,
	"createdAt" timestamp with time zone NOT NULL,
	"metadata" text
);
CREATE TABLE "neon_auth"."project_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"endpoint_id" text NOT NULL CONSTRAINT "project_config_endpoint_id_key" UNIQUE,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"trusted_origins" jsonb NOT NULL,
	"social_providers" jsonb NOT NULL,
	"email_provider" jsonb,
	"email_and_password" jsonb,
	"allow_localhost" boolean NOT NULL
);
CREATE TABLE "neon_auth"."session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL CONSTRAINT "session_token_key" UNIQUE,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" uuid NOT NULL,
	"impersonatedBy" text,
	"activeOrganizationId" text
);
CREATE TABLE "neon_auth"."user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL CONSTRAINT "user_email_key" UNIQUE,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"role" text,
	"banned" boolean,
	"banReason" text,
	"banExpires" timestamp with time zone
);
CREATE TABLE "neon_auth"."verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "lab_system"."balanca" (
	"id" serial PRIMARY KEY,
	"patrimonio" varchar(50) NOT NULL CONSTRAINT "balanca_patrimonio_key" UNIQUE,
	"calibracao_externa" boolean DEFAULT false,
	"fk_cod_setor" integer,
	"status" varchar(20),
	"diferenca_reprovacao" numeric,
	"data_criacao" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "balanca_status_check" CHECK (CHECK (((status)::text = ANY ((ARRAY['Aprovado'::character varying, 'Reprovado'::character varying])::text[]))))
);
CREATE TABLE "lab_system"."descolagem" (
	"id" serial PRIMARY KEY,
	"titulo" varchar(200),
	"arquivo_nome" varchar(255),
	"arquivo_path" text,
	"data_upload" timestamp DEFAULT now() NOT NULL,
	"fk_modelo_cod_modelo" integer,
	"fk_cod_setor" integer,
	"fk_funcionario_matricula" varchar(50),
	"lado" varchar(20) DEFAULT 'Único',
	"marca" varchar(100),
	"requisitante" varchar(100),
	"lider" varchar(100),
	"coordenador" varchar(100),
	"gerente" varchar(100),
	"esteira" varchar(100),
	"adesivo" varchar(100),
	"adesivo_fornecedor" varchar(100),
	"data_realizacao" date,
	"data_colagem" date,
	"cores" varchar(200),
	"numero_pedido" varchar(100),
	"especificacao_valor" varchar(100),
	"observacoes" text,
	"valor_media" numeric,
	"valor_minimo" numeric,
	"valor_maximo" numeric,
	"status_final" "lab_system"."status_enum",
	"realizado_por" varchar(100),
	"fk_laudo_id" integer
);
CREATE TABLE "lab_system"."especificacao" (
	"cod_especificacao" serial PRIMARY KEY,
	"cod_modelo" integer NOT NULL,
	"tipo" "lab_system"."tipo_enum" NOT NULL,
	"valor_especificacao" numeric,
	"valor_variacao" numeric
);
CREATE TABLE "lab_system"."funcionario" (
	"turno" "lab_system"."turno_enum",
	"nome" varchar(50),
	"sobrenome" varchar(50),
	"matricula" varchar(50) PRIMARY KEY,
	"fk_cod_setor" integer
);
CREATE TABLE "lab_system"."laudo" (
	"id" serial PRIMARY KEY,
	"fk_funcionario_matricula" varchar(50),
	"fk_modelo_cod_modelo" integer,
	"fk_material" varchar(100),
	"fk_cod_setor" integer,
	"status_geral" varchar(20) DEFAULT 'Pendente',
	"observacoes" text,
	"data_criacao" timestamp DEFAULT CURRENT_TIMESTAMP,
	"codigo_laudo" varchar(20) CONSTRAINT "laudo_codigo_laudo_key" UNIQUE
);
CREATE TABLE "lab_system"."local" (
	"cod_local" serial PRIMARY KEY,
	"prateleira" varchar(10),
	"caixa" varchar(10),
	"fileira" varchar(10)
);
CREATE TABLE "lab_system"."marca" (
	"cod_marca" serial PRIMARY KEY,
	"nome" varchar(30) CONSTRAINT "marca_nome_key" UNIQUE
);
CREATE TABLE "lab_system"."material" (
	"tipo" "lab_system"."type_material",
	"referencia" varchar(10) PRIMARY KEY,
	"cod_setor" integer NOT NULL
);
CREATE TABLE "lab_system"."metodo" (
	"cod_metodo" serial PRIMARY KEY,
	"descricao" text,
	"nome" varchar(30),
	"cod_marca" integer
);
CREATE TABLE "lab_system"."modelo" (
	"cod_modelo" serial PRIMARY KEY,
	"nome" varchar(30) CONSTRAINT "modelo_nome_key" UNIQUE,
	"tipo" "lab_system"."modelo_tipo",
	"cod_marca" integer,
	"fk_msc_id" integer,
	"fk_msc_id_bn" integer,
	"fk_msc_id_dn" integer
);
CREATE TABLE "lab_system"."msc" (
	"id" serial PRIMARY KEY,
	"nome" varchar(100) NOT NULL CONSTRAINT "msc_nome_key" UNIQUE,
	"descricao" text,
	"data_criacao" timestamp DEFAULT now(),
	"tipo" varchar(20) DEFAULT 'DN'
);
CREATE TABLE "lab_system"."msc_especificacao" (
	"id" serial PRIMARY KEY,
	"fk_msc_id" integer,
	"tipo_teste" "lab_system"."tipo_enum" NOT NULL,
	"regra_tipo" varchar(20) DEFAULT 'fixed',
	"v_alvo" numeric,
	"v_variacao" numeric,
	"v_min" numeric,
	"v_max" numeric
);
CREATE TABLE "lab_system"."setor" (
	"id" serial PRIMARY KEY,
	"nome" varchar(30) CONSTRAINT "setor_nome_key" UNIQUE,
	"tipo_padrao" "lab_system"."setor_enum",
	"config_perfil" varchar(50) DEFAULT 'padrao'
);
CREATE TABLE "lab_system"."telefone" (
	"id" serial PRIMARY KEY,
	"telefone" varchar(16),
	"fk_funcionario_matricula" varchar(50)
);
CREATE TABLE "lab_system"."teste" (
	"cod_teste" serial PRIMARY KEY,
	"status" "lab_system"."status_enum" DEFAULT 'Pendente'::"lab_system"."status_enum",
	"data_inicio" timestamp DEFAULT now() NOT NULL,
	"data_fim" timestamp,
	"resultado" double precision,
	"fk_local_cod_local" integer,
	"fk_tipo_cod_tipo" integer,
	"fk_funcionario_matricula" varchar(50),
	"fk_modelo_cod_modelo" integer,
	"fk_cod_espec" integer,
	"fk_cod_setor" integer NOT NULL,
	"fk_material" varchar(10) NOT NULL,
	"fk_laudo_id" integer
);
CREATE TABLE "lab_system"."tipo" (
	"cod_tipo" serial PRIMARY KEY,
	"nome" "lab_system"."tipo_enum" CONSTRAINT "tipo_nome_key" UNIQUE
);
CREATE TABLE "lab_system"."usuario" (
	"id" serial PRIMARY KEY,
	"email" varchar(100) NOT NULL CONSTRAINT "usuario_email_key" UNIQUE,
	"senha" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'user',
	"fk_funcionario_matricula" varchar(50),
	"data_criacao" timestamp DEFAULT now(),
	"fk_cod_setor" integer
);
ALTER TABLE "neon_auth"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "lab_system"."balanca" ADD CONSTRAINT "balanca_fk_cod_setor_fkey" FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id");
ALTER TABLE "lab_system"."descolagem" ADD CONSTRAINT "descolagem_fk_funcionario" FOREIGN KEY ("fk_funcionario_matricula") REFERENCES "lab_system"."funcionario"("matricula") ON DELETE SET NULL;
ALTER TABLE "lab_system"."descolagem" ADD CONSTRAINT "descolagem_fk_laudo_id_fkey" FOREIGN KEY ("fk_laudo_id") REFERENCES "lab_system"."laudo"("id") ON DELETE CASCADE;
ALTER TABLE "lab_system"."descolagem" ADD CONSTRAINT "descolagem_fk_modelo" FOREIGN KEY ("fk_modelo_cod_modelo") REFERENCES "lab_system"."modelo"("cod_modelo") ON DELETE SET NULL;
ALTER TABLE "lab_system"."descolagem" ADD CONSTRAINT "descolagem_fk_setor" FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id") ON DELETE SET NULL;
ALTER TABLE "lab_system"."especificacao" ADD CONSTRAINT "f_cod_modelo" FOREIGN KEY ("cod_modelo") REFERENCES "lab_system"."modelo"("cod_modelo") ON DELETE CASCADE;
ALTER TABLE "lab_system"."funcionario" ADD CONSTRAINT "funcionario_fk_setor" FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id") ON DELETE SET NULL;
ALTER TABLE "lab_system"."laudo" ADD CONSTRAINT "laudo_fk_cod_setor_fkey" FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id");
ALTER TABLE "lab_system"."laudo" ADD CONSTRAINT "laudo_fk_funcionario_matricula_fkey" FOREIGN KEY ("fk_funcionario_matricula") REFERENCES "lab_system"."funcionario"("matricula");
ALTER TABLE "lab_system"."laudo" ADD CONSTRAINT "laudo_fk_modelo_cod_modelo_fkey" FOREIGN KEY ("fk_modelo_cod_modelo") REFERENCES "lab_system"."modelo"("cod_modelo");
ALTER TABLE "lab_system"."material" ADD CONSTRAINT "cod_setor" FOREIGN KEY ("cod_setor") REFERENCES "lab_system"."setor"("id") ON DELETE CASCADE;
ALTER TABLE "lab_system"."metodo" ADD CONSTRAINT "cod_marca" FOREIGN KEY ("cod_marca") REFERENCES "lab_system"."marca"("cod_marca") ON DELETE CASCADE;
ALTER TABLE "lab_system"."modelo" ADD CONSTRAINT "cod_marca" FOREIGN KEY ("cod_marca") REFERENCES "lab_system"."marca"("cod_marca") ON DELETE CASCADE;
ALTER TABLE "lab_system"."modelo" ADD CONSTRAINT "modelo_fk_msc_id_bn_fkey" FOREIGN KEY ("fk_msc_id_bn") REFERENCES "lab_system"."msc"("id");
ALTER TABLE "lab_system"."modelo" ADD CONSTRAINT "modelo_fk_msc_id_dn_fkey" FOREIGN KEY ("fk_msc_id_dn") REFERENCES "lab_system"."msc"("id");
ALTER TABLE "lab_system"."modelo" ADD CONSTRAINT "modelo_fk_msc_id_fkey" FOREIGN KEY ("fk_msc_id") REFERENCES "lab_system"."msc"("id");
ALTER TABLE "lab_system"."msc_especificacao" ADD CONSTRAINT "msc_especificacao_fk_msc_id_fkey" FOREIGN KEY ("fk_msc_id") REFERENCES "lab_system"."msc"("id") ON DELETE CASCADE;
ALTER TABLE "lab_system"."telefone" ADD CONSTRAINT "telefone_fk_funcionario" FOREIGN KEY ("fk_funcionario_matricula") REFERENCES "lab_system"."funcionario"("matricula") ON DELETE CASCADE;
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "fk_cod_espec" FOREIGN KEY ("fk_cod_espec") REFERENCES "lab_system"."especificacao"("cod_especificacao");
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "fk_cod_setor" FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id");
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "fk_material" FOREIGN KEY ("fk_material") REFERENCES "lab_system"."material"("referencia");
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "teste_fk_funcionario_matricula_fkey" FOREIGN KEY ("fk_funcionario_matricula") REFERENCES "lab_system"."funcionario"("matricula") ON DELETE RESTRICT;
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "teste_fk_laudo_id_fkey" FOREIGN KEY ("fk_laudo_id") REFERENCES "lab_system"."laudo"("id") ON DELETE CASCADE;
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "teste_fk_local_cod_local_fkey" FOREIGN KEY ("fk_local_cod_local") REFERENCES "lab_system"."local"("cod_local") ON DELETE RESTRICT;
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "teste_fk_modelo_cod_modelo_fkey" FOREIGN KEY ("fk_modelo_cod_modelo") REFERENCES "lab_system"."modelo"("cod_modelo") ON DELETE RESTRICT;
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "teste_fk_tipo_cod_tipo_fkey" FOREIGN KEY ("fk_tipo_cod_tipo") REFERENCES "lab_system"."tipo"("cod_tipo") ON DELETE RESTRICT;
ALTER TABLE "lab_system"."usuario" ADD CONSTRAINT "usuario_fk_funcionario" FOREIGN KEY ("fk_funcionario_matricula") REFERENCES "lab_system"."funcionario"("matricula") ON DELETE SET NULL;
ALTER TABLE "lab_system"."usuario" ADD CONSTRAINT "usuario_fk_setor" FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id") ON DELETE SET NULL;
CREATE UNIQUE INDEX "account_pkey" ON "neon_auth"."account" ("id");
CREATE INDEX "account_userId_idx" ON "neon_auth"."account" ("userId");
CREATE INDEX "invitation_email_idx" ON "neon_auth"."invitation" ("email");
CREATE INDEX "invitation_organizationId_idx" ON "neon_auth"."invitation" ("organizationId");
CREATE UNIQUE INDEX "invitation_pkey" ON "neon_auth"."invitation" ("id");
CREATE UNIQUE INDEX "jwks_pkey" ON "neon_auth"."jwks" ("id");
CREATE INDEX "member_organizationId_idx" ON "neon_auth"."member" ("organizationId");
CREATE UNIQUE INDEX "member_pkey" ON "neon_auth"."member" ("id");
CREATE INDEX "member_userId_idx" ON "neon_auth"."member" ("userId");
CREATE UNIQUE INDEX "organization_pkey" ON "neon_auth"."organization" ("id");
CREATE UNIQUE INDEX "organization_slug_key" ON "neon_auth"."organization" ("slug");
CREATE UNIQUE INDEX "organization_slug_uidx" ON "neon_auth"."organization" ("slug");
CREATE UNIQUE INDEX "project_config_endpoint_id_key" ON "neon_auth"."project_config" ("endpoint_id");
CREATE UNIQUE INDEX "project_config_pkey" ON "neon_auth"."project_config" ("id");
CREATE UNIQUE INDEX "session_pkey" ON "neon_auth"."session" ("id");
CREATE UNIQUE INDEX "session_token_key" ON "neon_auth"."session" ("token");
CREATE INDEX "session_userId_idx" ON "neon_auth"."session" ("userId");
CREATE UNIQUE INDEX "user_email_key" ON "neon_auth"."user" ("email");
CREATE UNIQUE INDEX "user_pkey" ON "neon_auth"."user" ("id");
CREATE INDEX "verification_identifier_idx" ON "neon_auth"."verification" ("identifier");
CREATE UNIQUE INDEX "verification_pkey" ON "neon_auth"."verification" ("id");
CREATE UNIQUE INDEX "balanca_patrimonio_key" ON "lab_system"."balanca" ("patrimonio");
CREATE UNIQUE INDEX "balanca_pkey" ON "lab_system"."balanca" ("id");
CREATE UNIQUE INDEX "descolagem_pkey" ON "lab_system"."descolagem" ("id");
CREATE INDEX "idx_descolagem_laudo" ON "lab_system"."descolagem" ("fk_laudo_id");
CREATE UNIQUE INDEX "especificacao_pkey" ON "lab_system"."especificacao" ("cod_especificacao");
CREATE UNIQUE INDEX "funcionario_pkey" ON "lab_system"."funcionario" ("matricula");
CREATE INDEX "idx_funcionario_setor" ON "lab_system"."funcionario" ("fk_cod_setor");
CREATE UNIQUE INDEX "laudo_codigo_laudo_key" ON "lab_system"."laudo" ("codigo_laudo");
CREATE UNIQUE INDEX "laudo_pkey" ON "lab_system"."laudo" ("id");
CREATE UNIQUE INDEX "local_pkey" ON "lab_system"."local" ("cod_local");
CREATE UNIQUE INDEX "marca_nome_key" ON "lab_system"."marca" ("nome");
CREATE UNIQUE INDEX "marca_pkey" ON "lab_system"."marca" ("cod_marca");
CREATE UNIQUE INDEX "material_pkey" ON "lab_system"."material" ("referencia");
CREATE UNIQUE INDEX "metodo_pkey" ON "lab_system"."metodo" ("cod_metodo");
CREATE UNIQUE INDEX "modelo_nome_key" ON "lab_system"."modelo" ("nome");
CREATE UNIQUE INDEX "modelo_pkey" ON "lab_system"."modelo" ("cod_modelo");
CREATE UNIQUE INDEX "msc_nome_key" ON "lab_system"."msc" ("nome");
CREATE UNIQUE INDEX "msc_pkey" ON "lab_system"."msc" ("id");
CREATE UNIQUE INDEX "msc_especificacao_pkey" ON "lab_system"."msc_especificacao" ("id");
CREATE UNIQUE INDEX "setor_nome_key" ON "lab_system"."setor" ("nome");
CREATE UNIQUE INDEX "setor_pkey" ON "lab_system"."setor" ("id");
CREATE UNIQUE INDEX "telefone_pkey" ON "lab_system"."telefone" ("id");
CREATE UNIQUE INDEX "teste_pkey" ON "lab_system"."teste" ("cod_teste");
CREATE UNIQUE INDEX "tipo_nome_key" ON "lab_system"."tipo" ("nome");
CREATE UNIQUE INDEX "tipo_pkey" ON "lab_system"."tipo" ("cod_tipo");
CREATE INDEX "idx_usuario_email" ON "lab_system"."usuario" ("email");
CREATE INDEX "idx_usuario_setor" ON "lab_system"."usuario" ("fk_cod_setor");
CREATE UNIQUE INDEX "usuario_email_key" ON "lab_system"."usuario" ("email");
CREATE UNIQUE INDEX "usuario_pkey" ON "lab_system"."usuario" ("id");