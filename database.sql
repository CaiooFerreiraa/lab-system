-- ========================================
-- LAB SYSTEM — Schema DDL Original + Extensões
-- ========================================

CREATE SCHEMA IF NOT EXISTS "neon_auth";
CREATE SCHEMA IF NOT EXISTS "lab_system";

-- 1. ENUMS (Usando DO para evitar erros se já existirem)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_enum') THEN
        CREATE TYPE "lab_system"."tipo_enum" AS ENUM('DUREZA', 'DENSIDADE', 'RESILIENCIA', 'ENCOLHIMENTO', 'COMPRESSION SET', 'RASGAMENTO', 'ALONGAMENTO_TRACAO', 'ABRASAO DIN', 'ABRASAO AKRON', 'MODULO 300%', 'TEOR DE GEIS', 'TEOR DE UMIDADE_DE_SILICA', 'UMIDADE DE EVA', 'VOLUME DE GAS', 'BLOOMING', 'ENVELHECIMENTO', 'HIDROLISE', 'DESCOLAGEM', 'RESISTENCIA A LAVAGEM');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modelo_tipo') THEN
        CREATE TYPE "lab_system"."modelo_tipo" AS ENUM('Casual', 'Esportivo', 'Alta Performance');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'turno_enum') THEN
        CREATE TYPE "lab_system"."turno_enum" AS ENUM('Turno A', 'Turno B', 'Turno C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_material') THEN
        CREATE TYPE "lab_system"."type_material" AS ENUM('BN', 'DN', 'Base');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
        CREATE TYPE "lab_system"."status_enum" AS ENUM('Concluído', 'Pendente', 'Em Andamento', 'Aprovado', 'Reprovado');
    END IF;
END $$;

-- 2. TABELAS (CONFORME SEU SCHEMA FUNCIONAL)
CREATE TABLE IF NOT EXISTS "lab_system"."especificacao" (
	"cod_especificacao" serial PRIMARY KEY,
	"cod_modelo" integer NOT NULL,
	"tipo" "lab_system"."tipo_enum" NOT NULL,
	"valor_especificacao" numeric,
	"valor_variacao" numeric
);

CREATE TABLE IF NOT EXISTS "lab_system"."funcionario" (
	"turno" "lab_system"."turno_enum",
	"nome" varchar(50),
	"sobrenome" varchar(50),
	"matricula" varchar(50) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "lab_system"."local" (
	"cod_local" serial PRIMARY KEY,
	"prateleira" varchar(10),
	"caixa" varchar(10),
	"fileira" varchar(10)
);

CREATE TABLE IF NOT EXISTS "lab_system"."marca" (
	"cod_marca" serial PRIMARY KEY,
	"nome" varchar(30) CONSTRAINT "marca_nome_key" UNIQUE
);

CREATE TABLE IF NOT EXISTS "lab_system"."material" (
	"tipo" "lab_system"."type_material",
	"referencia" varchar(10) PRIMARY KEY,
	"cod_setor" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "lab_system"."metodo" (
	"cod_metodo" serial PRIMARY KEY,
	"descricao" text,
	"nome" varchar(30),
	"cod_marca" integer
);

CREATE TABLE IF NOT EXISTS "lab_system"."modelo" (
	"cod_modelo" serial PRIMARY KEY,
	"nome" varchar(30) CONSTRAINT "modelo_nome_key" UNIQUE,
	"tipo" "lab_system"."modelo_tipo",
	"cod_marca" integer
);

CREATE TABLE IF NOT EXISTS "lab_system"."setor" (
	"id" serial PRIMARY KEY,
	"nome" varchar(30) CONSTRAINT "setor_nome_key" UNIQUE
);

CREATE TABLE IF NOT EXISTS "lab_system"."tipo" (
	"cod_tipo" serial PRIMARY KEY,
	"nome" "lab_system"."tipo_enum" UNIQUE
);

CREATE TABLE IF NOT EXISTS "lab_system"."telefone" (
	"id" serial PRIMARY KEY,
	"telefone" varchar(16),
	"fk_funcionario_matricula" varchar(50)
);

CREATE TABLE IF NOT EXISTS "lab_system"."teste" (
	"cod_teste" serial PRIMARY KEY,
	"status" "lab_system"."status_enum" DEFAULT 'Pendente',
	"data_inicio" timestamp DEFAULT now() NOT NULL,
	"data_fim" timestamp,
	"resultado" double precision,
	"fk_local_cod_local" integer,
	"fk_tipo_cod_tipo" integer,
	"fk_funcionario_matricula" varchar(50),
	"fk_modelo_cod_modelo" integer,
	"fk_cod_espec" integer NOT NULL,
	"fk_cod_setor" integer NOT NULL,
	"fk_material" varchar(10) NOT NULL
);

-- 3. TABELA DE DESCOLAGEM (ADICIONADA)
CREATE TABLE IF NOT EXISTS "lab_system"."descolagem" (
    "id" serial PRIMARY KEY,
    "titulo" varchar(200) NOT NULL,
    "arquivo_nome" varchar(255) NOT NULL,
    "arquivo_path" text NOT NULL,
    "data_upload" timestamp DEFAULT now() NOT NULL,
    "fk_modelo_cod_modelo" integer,
    "fk_cod_setor" integer,
    "fk_funcionario_matricula" varchar(50),
    "lado" varchar(20) DEFAULT 'Único', -- 'Esquerdo', 'Direito', 'Único'
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
    "realizado_por" varchar(100),
    "observacoes" text,
    -- Coleta de dados do PDF (campos estruturados)
    "valor_media" numeric,
    "valor_minimo" numeric,
    "valor_maximo" numeric,
    "status_final" "lab_system"."status_enum"
);

-- 4. CONSTRAINTS (FOREIGN KEYS)
ALTER TABLE "lab_system"."especificacao" ADD CONSTRAINT "f_cod_modelo" FOREIGN KEY ("cod_modelo") REFERENCES "lab_system"."modelo"("cod_modelo") ON DELETE CASCADE;
ALTER TABLE "lab_system"."material" ADD CONSTRAINT "cod_setor" FOREIGN KEY ("cod_setor") REFERENCES "lab_system"."setor"("id") ON DELETE CASCADE;
ALTER TABLE "lab_system"."metodo" ADD CONSTRAINT "cod_marca" FOREIGN KEY ("cod_marca") REFERENCES "lab_system"."marca"("cod_marca") ON DELETE CASCADE;
ALTER TABLE "lab_system"."modelo" ADD CONSTRAINT "cod_marca" FOREIGN KEY ("cod_marca") REFERENCES "lab_system"."marca"("cod_marca") ON DELETE CASCADE;
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "fk_cod_espec" FOREIGN KEY ("fk_cod_espec") REFERENCES "lab_system"."especificacao"("cod_especificacao");
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "fk_cod_setor" FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id");
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "fk_material" FOREIGN KEY ("fk_material") REFERENCES "lab_system"."material"("referencia");
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "teste_fk_funcionario_matricula_fkey" FOREIGN KEY ("fk_funcionario_matricula") REFERENCES "lab_system"."funcionario"("matricula") ON DELETE RESTRICT;
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "teste_fk_local_cod_local_fkey" FOREIGN KEY ("fk_local_cod_local") REFERENCES "lab_system"."local"("cod_local") ON DELETE RESTRICT;
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "teste_fk_modelo_cod_modelo_fkey" FOREIGN KEY ("fk_modelo_cod_modelo") REFERENCES "lab_system"."modelo"("cod_modelo") ON DELETE RESTRICT;
ALTER TABLE "lab_system"."teste" ADD CONSTRAINT "teste_fk_tipo_cod_tipo_fkey" FOREIGN KEY ("fk_tipo_cod_tipo") REFERENCES "lab_system"."tipo"("cod_tipo") ON DELETE RESTRICT;

-- Foreign Keys para Telefone
ALTER TABLE "lab_system"."telefone" ADD CONSTRAINT "telefone_fk_funcionario" FOREIGN KEY ("fk_funcionario_matricula") REFERENCES "lab_system"."funcionario"("matricula") ON DELETE CASCADE;

-- Foreign Keys para Descolagem
ALTER TABLE "lab_system"."descolagem" ADD CONSTRAINT "descolagem_fk_modelo" FOREIGN KEY ("fk_modelo_cod_modelo") REFERENCES "lab_system"."modelo"("cod_modelo") ON DELETE SET NULL;
ALTER TABLE "lab_system"."descolagem" ADD CONSTRAINT "descolagem_fk_setor" FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id") ON DELETE SET NULL;
ALTER TABLE "lab_system"."descolagem" ADD CONSTRAINT "descolagem_fk_funcionario" FOREIGN KEY ("fk_funcionario_matricula") REFERENCES "lab_system"."funcionario"("matricula") ON DELETE SET NULL;

-- 5. SEED DATA (CRITICAL PARA O ERRO "DUREZA NÃO ENCONTRADO")
INSERT INTO "lab_system"."tipo" ("nome") VALUES
  ('DUREZA'), ('DENSIDADE'), ('RESILIENCIA'), ('ENCOLHIMENTO'), ('COMPRESSION SET'),
  ('RASGAMENTO'), ('ALONGAMENTO_TRACAO'), ('ABRASAO DIN'), ('ABRASAO AKRON'), ('MODULO 300%'),
  ('TEOR DE GEIS'), ('TEOR DE UMIDADE_DE_SILICA'), ('UMIDADE DE EVA'), ('VOLUME DE GAS'),
  ('BLOOMING'), ('ENVELHECIMENTO'), ('HIDROLISE'), ('DESCOLAGEM'), ('RESISTENCIA A LAVAGEM')
ON CONFLICT ("nome") DO NOTHING;
