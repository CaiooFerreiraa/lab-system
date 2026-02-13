-- Migration: Add sector to usuario + role constraints
-- Description: Adiciona coluna de setor ao usuário para controle de visibilidade por setor.

-- 1. Adicionar coluna de setor ao usuário
ALTER TABLE "lab_system"."usuario" 
ADD COLUMN IF NOT EXISTS "fk_cod_setor" integer;

-- 2. FK para setor
ALTER TABLE "lab_system"."usuario" 
ADD CONSTRAINT "usuario_fk_setor" 
FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id") ON DELETE SET NULL;

-- 3. Index para busca rápida por setor
CREATE INDEX IF NOT EXISTS "idx_usuario_setor" ON "lab_system"."usuario"("fk_cod_setor");
