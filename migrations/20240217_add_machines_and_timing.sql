-- Migração para Máquinas, Tempos de Teste e Notificações

-- 1. Tabela de Máquinas
CREATE TABLE IF NOT EXISTS "lab_system"."maquina" (
    "id" serial PRIMARY KEY,
    "nome" varchar(100) NOT NULL UNIQUE,
    "descricao" text,
    "fk_cod_setor" integer REFERENCES "lab_system"."setor"("id") ON DELETE SET NULL,
    "status" varchar(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Manutenção')),
    "data_criacao" timestamp DEFAULT now()
);

-- 2. Configuração de Tempos por Tipo de Teste e Máquina
CREATE TABLE IF NOT EXISTS "lab_system"."maquina_teste_config" (
    "id" serial PRIMARY KEY,
    "fk_maquina_id" integer NOT NULL REFERENCES "lab_system"."maquina"("id") ON DELETE CASCADE,
    "fk_tipo_cod_tipo" integer NOT NULL REFERENCES "lab_system"."tipo"("cod_tipo") ON DELETE CASCADE,
    "tempo_estimado_segundos" integer NOT NULL DEFAULT 60,
    CONSTRAINT "maquina_tipo_unique" UNIQUE ("fk_maquina_id", "fk_tipo_cod_tipo")
);

-- 3. Tabela de Emails para Notificações (Fallback e Relatórios)
CREATE TABLE IF NOT EXISTS "lab_system"."email_notificacao" (
    "id" serial PRIMARY KEY,
    "email" varchar(255) NOT NULL,
    "tipo" varchar(50) NOT NULL, -- 'fallback_atraso' ou 'relatorio_diario'
    "nome_contato" varchar(100),
    "data_cadastro" timestamp DEFAULT now()
);

-- 4. Atualização da Tabela de Testes para vincular Máquina e Tempo Real
ALTER TABLE "lab_system"."teste" 
ADD COLUMN IF NOT EXISTS "fk_maquina_id" integer REFERENCES "lab_system"."maquina"("id") ON DELETE SET NULL;

ALTER TABLE "lab_system"."teste" 
ADD COLUMN IF NOT EXISTS "tempo_real_segundos" integer DEFAULT 0;

-- 5. Comentários para documentação
COMMENT ON COLUMN "lab_system"."teste"."tempo_real_segundos" IS 'Tempo real levado para realizar o teste em segundos';
COMMENT ON COLUMN "lab_system"."maquina_teste_config"."tempo_estimado_segundos" IS 'SLA interno ou tempo padrão para este teste nesta máquina';
