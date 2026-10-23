-- 004_backoffice.sql - Migración para back-office MultiCatálogo
-- FASE 0: Columnas necesarias para el funcionamiento del MLM

-- ALTER usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS nombre VARCHAR(255),
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS referido_id INTEGER,
ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT NOW();

-- ALTER referidos
ALTER TABLE referidos
ADD COLUMN IF NOT EXISTS codigo VARCHAR(50) UNIQUE;

-- Generar códigos para seed existente (solo si existen las filas)
UPDATE referidos SET codigo = 'TU' WHERE id = 1 AND codigo IS NULL;
UPDATE referidos SET codigo = 'ANA' WHERE id = 2 AND codigo IS NULL;
UPDATE referidos SET codigo = 'LUIS' WHERE id = 3 AND codigo IS NULL;
UPDATE referidos SET codigo = 'MARTA' WHERE id = 4 AND codigo IS NULL;

-- ALTER productos
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- ALTER pedidos
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id);

-- Tabla de liquidaciones (DEBE crearse ANTES de comisiones por la FK)
CREATE TABLE IF NOT EXISTS liquidaciones (
    id SERIAL PRIMARY KEY,
    referido_id INTEGER REFERENCES referidos(id),
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    creado_en TIMESTAMP DEFAULT NOW(),
    pagada_en TIMESTAMP
);

-- Tabla de comisiones (referencia liquidaciones, por eso va después)
CREATE TABLE IF NOT EXISTS comisiones (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id),
    referido_id INTEGER REFERENCES referidos(id),
    nivel INTEGER NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    liquidacion_id INTEGER REFERENCES liquidaciones(id),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comisiones_referido_pedido ON comisiones(referido_id, pedido_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_estado ON comisiones(estado);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_referido ON liquidaciones(referido_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_estado ON liquidaciones(estado);
