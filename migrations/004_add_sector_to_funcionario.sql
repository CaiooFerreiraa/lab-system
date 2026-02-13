-- Migration: Add sector to funcionario
-- Description: Vincula cada funcionário a um setor específico.

ALTER TABLE "lab_system"."funcionario" 
ADD COLUMN IF NOT EXISTS "fk_cod_setor" integer;

ALTER TABLE "lab_system"."funcionario" 
ADD CONSTRAINT "funcionario_fk_setor" 
FOREIGN KEY ("fk_cod_setor") REFERENCES "lab_system"."setor"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_funcionario_setor" ON "lab_system"."funcionario"("fk_cod_setor");
