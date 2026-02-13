-- Migration: Add profile to sector
-- Description: Adiciona uma coluna para definir o perfil de acesso do setor, permitindo controle dinâmico de permissões.

ALTER TABLE "lab_system"."setor" 
ADD COLUMN IF NOT EXISTS "config_perfil" VARCHAR(50) DEFAULT 'padrao';

-- Atualizar setores existentes com perfis baseados em seus nomes (se aplicável)
UPDATE "lab_system"."setor" SET "config_perfil" = 'laboratório' WHERE LOWER(nome) = 'laboratório';
UPDATE "lab_system"."setor" SET "config_perfil" = 'borracha' WHERE LOWER(nome) = 'borracha';
UPDATE "lab_system"."setor" SET "config_perfil" = 'injetado' WHERE LOWER(nome) = 'injetado';
UPDATE "lab_system"."setor" SET "config_perfil" = 'protótipo' WHERE LOWER(nome) = 'protótipo';
UPDATE "lab_system"."setor" SET "config_perfil" = 'almoxarifado' WHERE LOWER(nome) = 'almoxarifado';
UPDATE "lab_system"."setor" SET "config_perfil" = 'pré-fabricado' WHERE LOWER(nome) = 'pré-fabricado';
UPDATE "lab_system"."setor" SET "config_perfil" = 'químico' WHERE LOWER(nome) = 'químico';
