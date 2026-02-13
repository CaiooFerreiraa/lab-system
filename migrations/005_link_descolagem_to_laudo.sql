-- Migration: Link Descolagem to Laudo and make file fields optional
-- Description: Permite que informações de produção (descolagem) sejam vinculadas a um laudo técnico, mesmo sem um arquivo PDF enviado.

ALTER TABLE "lab_system"."descolagem" 
ADD COLUMN IF NOT EXISTS "fk_laudo_id" INTEGER REFERENCES "lab_system"."laudo"("id") ON DELETE CASCADE;

-- Tornar campos de arquivo opcionais para permitir cadastro manual via TestRegister
ALTER TABLE "lab_system"."descolagem" ALTER COLUMN "titulo" DROP NOT NULL;
ALTER TABLE "lab_system"."descolagem" ALTER COLUMN "arquivo_nome" DROP NOT NULL;
ALTER TABLE "lab_system"."descolagem" ALTER COLUMN "arquivo_path" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_descolagem_laudo" ON "lab_system"."descolagem"("fk_laudo_id");
