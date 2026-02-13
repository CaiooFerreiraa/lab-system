-- Migration: Setup Sector Enum and Seed Table
-- Description: Cria um enum para os setores padrão e garante que a tabela de setores esteja populada, permitindo expansão futura.

-- 1. Criar o Enum de Setores Padrão
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'setor_enum') THEN
        CREATE TYPE "lab_system"."setor_enum" AS ENUM (
            'Borracha', 
            'Injetado', 
            'Protótipo', 
            'Almoxarifado', 
            'Pré-Fabricado', 
            'Químico'
        );
    END IF;
END $$;

-- 2. Garantir que a tabela de setores aceite os nomes (o varchar já permite isso)
-- e popular com os valores padrão se não existirem.
INSERT INTO "lab_system"."setor" ("nome") VALUES 
('Borracha'),
('Injetado'),
('Protótipo'),
('Almoxarifado'),
('Pré-Fabricado'),
('Químico')
ON CONFLICT ("nome") DO NOTHING;

-- 3. (Opcional) Adicionar uma coluna de "tipo_enum" na tabela de setor 
-- para caso queira vincular a lógica estrita do Enum ao registro da tabela.
ALTER TABLE "lab_system"."setor" 
ADD COLUMN IF NOT EXISTS "tipo_padrao" "lab_system"."setor_enum";

-- Sincronizar a coluna tipo_padrao para os setores que batem com o enum
UPDATE "lab_system"."setor" SET "tipo_padrao" = 'Borracha' WHERE "nome" = 'Borracha';
UPDATE "lab_system"."setor" SET "tipo_padrao" = 'Injetado' WHERE "nome" = 'Injetado';
UPDATE "lab_system"."setor" SET "tipo_padrao" = 'Protótipo' WHERE "nome" = 'Protótipo';
UPDATE "lab_system"."setor" SET "tipo_padrao" = 'Almoxarifado' WHERE "nome" = 'Almoxarifado';
UPDATE "lab_system"."setor" SET "tipo_padrao" = 'Pré-Fabricado' WHERE "nome" = 'Pré-Fabricado';
UPDATE "lab_system"."setor" SET "tipo_padrao" = 'Químico' WHERE "nome" = 'Químico';

-- 4. Garantir que tabelas que usam setor (como usuario) apontem sempre para a tabela (ID)
-- Isso permite expandir os setores livremente no futuro sem quebrar o banco.
-- (A Migration 002 já tratou da fk_cod_setor no usuário).
