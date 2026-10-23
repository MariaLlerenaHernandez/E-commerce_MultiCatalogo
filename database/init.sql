-- init.sql - Estructura base de la base de datos multicatalogo
-- Se ejecuta automáticamente al crear el contenedor PostgreSQL

-- Habilitar pgcrypto para bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255),
    rol VARCHAR(50) DEFAULT 'cliente',
    activo BOOLEAN DEFAULT true,
    referido_id INTEGER,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de referidos (red multinivel)
CREATE TABLE IF NOT EXISTS referidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE REFERENCES usuarios(id),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES referidos(id),
    nivel INTEGER DEFAULT 0,
    ventas DECIMAL(10,2) DEFAULT 0,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    categoria VARCHAR(100),
    img VARCHAR(500),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    ciudad VARCHAR(100),
    telefono VARCHAR(50),
    metodo_pago VARCHAR(100),
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de items de pedido
CREATE TABLE IF NOT EXISTS pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    nombre VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_referidos_parent_id ON referidos(parent_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
