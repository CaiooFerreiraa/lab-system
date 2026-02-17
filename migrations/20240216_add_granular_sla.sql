-- Cria tabela de configuração de prazos (SLA)
-- Permite definir prazos diferentes por combinação de Setor e Tipo de Material
CREATE TABLE IF NOT EXISTS "lab_system"."config_prazo" (
    "id" SERIAL PRIMARY KEY,
    "fk_cod_setor" INTEGER NOT NULL REFERENCES "lab_system"."setor"("id") ON DELETE CASCADE,
    "material_tipo" "lab_system"."type_material" NOT NULL,
    "dias_sla" INTEGER NOT NULL DEFAULT 4,
    UNIQUE("fk_cod_setor", "material_tipo")
);

-- Popula com dados iniciais baseados nos setores existentes para evitar prazos vazios
-- Pegamos o SLA que estava no setor e aplicamos para todos os tipos de material dele inicialmente
INSERT INTO "lab_system"."config_prazo" (fk_cod_setor, material_tipo, dias_sla)
SELECT s.id, t.typ, COALESCE(s.sla_entrega_dias, 4)
FROM "lab_system"."setor" s
CROSS JOIN (
    SELECT unnest(enum_range(NULL::"lab_system"."type_material")) as typ
) t
ON CONFLICT DO NOTHING;

-- Agora o sla_entrega_dias na tabela setor torna-se um fallback ou pode ser removido
-- Vamos mantê-lo por segurança mas a lógica principal usará a config_prazo
