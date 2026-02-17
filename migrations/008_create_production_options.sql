CREATE TABLE IF NOT EXISTS lab_system.opcoes_producao (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL, -- 'requisitante', 'lider', 'coordenador', 'gerente', 'esteira'
    valor VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(categoria, valor)
);
