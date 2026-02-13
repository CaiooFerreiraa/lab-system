-- Migration: Add Auth System
-- Description: Criação da tabela de usuários e ajuste na tabela de funcionários para suportar autenticação.

CREATE TABLE IF NOT EXISTS "lab_system"."usuario" (
    "id" serial PRIMARY KEY,
    "email" varchar(100) UNIQUE NOT NULL,
    "senha" varchar(255) NOT NULL,
    "role" varchar(20) DEFAULT 'user', -- 'admin', 'user', 'moderator'
    "fk_funcionario_matricula" varchar(50),
    "data_criacao" timestamp DEFAULT now(),
    CONSTRAINT "usuario_fk_funcionario" FOREIGN KEY ("fk_funcionario_matricula") REFERENCES "lab_system"."funcionario"("matricula") ON DELETE SET NULL
);

-- Index para busca rápida por email
CREATE INDEX IF NOT EXISTS "idx_usuario_email" ON "lab_system"."usuario"("email");
