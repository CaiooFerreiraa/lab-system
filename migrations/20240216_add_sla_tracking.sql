-- Adiciona SLA (Lead Time) por setor em dias úteis (Segunda a Sábado)
ALTER TABLE "lab_system"."setor" ADD COLUMN IF NOT EXISTS "sla_entrega_dias" INTEGER DEFAULT 4;

-- Adiciona campos de controle de prazo no laudo
ALTER TABLE "lab_system"."laudo" ADD COLUMN IF NOT EXISTS "data_recebimento" TIMESTAMP;
ALTER TABLE "lab_system"."laudo" ADD COLUMN IF NOT EXISTS "data_prazo" TIMESTAMP;

-- Adiciona um status "Recebido" ao enum se necessário
-- Como é um ENUM, precisamos verificar se podemos alterar. 
-- Nosso sistema usa ENUM no banco mas no front é texto livre às vezes.
-- O database.sql definiu status_enum.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'status_enum' AND e.enumlabel = 'Recebido') THEN
        ALTER TYPE "lab_system"."status_enum" ADD VALUE 'Recebido';
    END IF;
END $$;
