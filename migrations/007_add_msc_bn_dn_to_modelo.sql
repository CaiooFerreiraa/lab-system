-- Adiciona suporte para MCS de BN e DN no cadastro de modelo
ALTER TABLE lab_system.modelo ADD COLUMN IF NOT EXISTS fk_msc_id_bn INTEGER REFERENCES lab_system.msc(id);
ALTER TABLE lab_system.modelo ADD COLUMN IF NOT EXISTS fk_msc_id_dn INTEGER REFERENCES lab_system.msc(id);

-- Opcional: Transferir dados existentes de fk_msc_id para ambos se apropriado
-- UPDATE lab_system.modelo SET fk_msc_id_bn = fk_msc_id, fk_msc_id_dn = fk_msc_id WHERE fk_msc_id IS NOT NULL;
