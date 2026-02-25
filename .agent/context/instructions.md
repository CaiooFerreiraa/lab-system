# Lab System - Agent Instructions

Este arquivo fornece um contexto técnico detalhado para IAs trabalharem no projeto Lab System de forma eficiente e alinhada com os padrões existentes.

## 🛠 Tech Stack
- **Frontend**: React (Vite), JavaScript (ES6+), Vanilla CSS.
- **Backend**: Node.js, Express, ES Modules.
- **Banco de Dados**: PostgreSQL (Neon Database) com o driver `@neondatabase/serverless`.
- **Autenticação**: JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`).
- **Automação**: `node-cron` para tarefas agendadas e `nodemailer` para notificações por e-mail.
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

### 📋 Sistema de Laudos (Agrupamento de Testes)
- Testes individuais agora são obrigatoriamente vinculados a um **Laudo** (`lab_system.laudo`).
- **Finalidade**: Agrupar múltiplos ensaios para um mesmo calçado/material, centralizando metadados (modelo, material, setor requisitante).
- **Controle de Fluxo**:
  1. **Pendente**: Criado pelo requisitante.
  2. **Recebido**: Laboratório confirma recebimento físico (inicia contagem de SLA).
  3. **Em Andamento**: Testes sendo executados.
  4. **Concluído**: Todos os testes finalizados.
  5. **Auto-Avaliação**: O sistema avalia o laudo como 'Aprovado' ou 'Reprovado' com base nos resultados individuais.

### ⏱️ Gestão de SLA e Prazos
- O prazo de entrega (`data_prazo`) é calculado no momento que o laudo é marcado como **Recebido**.
- **Regra de Dias Úteis**: A contagem ignora domingos (trabalho considerado de Segunda a Sábado).
- **Prioridade Granular**: O sistema permite configurar SLAs específicos por combinação de Setor e Tipo de Material (`lab_system.config_prazo`).

### ⚙️ Performance de Máquinas e Equipamentos
- Cadastro de máquinas (`lab_system.maquina`) vinculadas a setores.
- **Configuração de Tempo**: Cadastro de tempos estimados (`tempo_estimado_segundos`) por tipo de teste para cada máquina.
- **Métricas de Produtividade**:
  - Registro de `tempo_real_segundos` em cada teste concluído.
  - Relatórios comparando Tempo Real vs. Estimado.
  - Taxa de utilização e eficiência por equipamento.

### 🔔 Automação e Notificações
- **Serviço de Automação**: Localizado em `server/utils/automation.js`, utiliza `node-cron`.
- **Relatório Diário**: Enviado automaticamente às 09:00 com o resumo de laudos do dia anterior/atual.
- **Alertas de Atraso**: O sistema verifica periodicamente testes que excederam o tempo estimado em 50% e envia alertas por e-mail para os responsáveis configurados.
- **Configuração**: Tabela `lab_system.notificacao_email` define quem recebe qual tipo de alerta.

### 🧪 Expansão da Descolagem (Peeling)
- Tabela `lab_system.descolagem` agora armazena metadados avançados (lado do calçado, adesivo, fornecedor, esteira, etc).
- **Prioridade Peeling**: Marcador de prioridade para testes de desenvolvimento acelerado.
- **Visualização**: Suporte para PDF Viewer de laudos e gráficos side-by-side no frontend.

## 💾 Schema do Banco de Dados (Lab System)
Abaixo está o DDL completo do banco de dados para referência de tipos, tabelas e relacionamentos:

```sql
CREATE SCHEMA "neon_auth";
CREATE SCHEMA "lab_system";

CREATE TYPE "lab_system"."tipo_enum" AS ENUM('DUREZA', 'DENSIDADE', 'RESILIENCIA', 'ENCOLHIMENTO', 'COMPRESSION SET', 'RASGAMENTO', 'ALONGAMENTO_TRACAO', 'ABRASAO DIN', 'ABRASAO AKRON', 'MODULO 300%', 'TEOR DE GEIS', 'TEOR DE UMIDADE_DE_SILICA', 'UMIDADE DE EVA', 'VOLUME DE GAS', 'BLOOMING', 'ENVELHECIMENTO', 'HIDROLISE', 'DESCOLAGEM', 'RESISTENCIA A LAVAGEM', 'ALONGAMENTO', 'TRACAO');
CREATE TYPE "lab_system"."modelo_tipo" AS ENUM('Casual', 'Esportivo', 'Alta Performance');
CREATE TYPE "lab_system"."turno_enum" AS ENUM('Turno A', 'Turno B', 'Turno C');
CREATE TYPE "lab_system"."type_material" AS ENUM('BN', 'DN', 'Base');
CREATE TYPE "lab_system"."status_enum" AS ENUM('Concluído', 'Pendente', 'Em Andamento', 'Aprovado', 'Reprovado', 'Recebido');
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
	"observacoes" text,
	CONSTRAINT "balanca_status_check" CHECK (((status)::text = ANY ((ARRAY['Aprovado'::character varying, 'Reprovado'::character varying])::text[])))
);

CREATE TABLE "lab_system"."config_prazo" (
	"id" serial PRIMARY KEY,
	"fk_cod_setor" integer NOT NULL,
	"material_tipo" "lab_system"."type_material" NOT NULL,
	"dias_sla" integer DEFAULT 4 NOT NULL,
	CONSTRAINT "config_prazo_fk_cod_setor_material_tipo_key" UNIQUE("fk_cod_setor","material_tipo")
);

CREATE TABLE "lab_system"."configuracao" (
	"id" varchar(50) PRIMARY KEY,
	"valor" jsonb NOT NULL,
	"data_atualizacao" timestamp DEFAULT now()
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
	"fk_laudo_id" integer,
	"prioridade" boolean DEFAULT false
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
	"codigo_laudo" varchar(20) CONSTRAINT "laudo_codigo_laudo_key" UNIQUE,
	"numero_pedido" varchar(50),
	"data_recebimento" timestamp,
	"data_prazo" timestamp
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

CREATE TABLE "lab_system"."opcoes_producao" (
	"id" serial PRIMARY KEY,
	"categoria" varchar(50) NOT NULL UNIQUE,
	"valor" varchar(255) NOT NULL UNIQUE,
	"data_criacao" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "opcoes_producao_categoria_valor_key" UNIQUE("categoria","valor")
);

CREATE TABLE "lab_system"."setor" (
	"id" serial PRIMARY KEY,
	"nome" varchar(30) CONSTRAINT "setor_nome_key" UNIQUE,
	"tipo_padrao" "lab_system"."setor_enum",
	"config_perfil" varchar(50) DEFAULT 'padrao',
	"sla_entrega_dias" integer DEFAULT 4
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

-- Indexações e Constraints de Foreign Key omitidas no bloco principal por brevidade, 
-- mas seguem as PKs e UNIQUEs definidas acima.
```

