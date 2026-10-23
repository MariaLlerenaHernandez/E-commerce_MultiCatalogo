-- seed.sql - Datos iniciales para MultiCatálogo
-- Habilitar pgcrypto para generación de hash bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insertar usuarios con passwords hasheados con bcrypt usando crypt('123456', gen_salt('bf', 10))
INSERT INTO usuarios (id, email, password, nombre, rol, activo, referido_id) VALUES
(1, 'admin@upse.edu.ec', crypt('123456', gen_salt('bf', 10)), 'Administrador', 'admin', true, NULL),
(2, 'cliente@upse.edu.ec', crypt('123456', gen_salt('bf', 10)), 'Cliente Demo', 'cliente', true, 1),
(3, 'ana@upse.edu.ec', crypt('123456', gen_salt('bf', 10)), 'Ana García', 'cliente', true, 1),
(4, 'luis@upse.edu.ec', crypt('123456', gen_salt('bf', 10)), 'Luis Poveda', 'cliente', true, 1),
(5, 'marta@upse.edu.ec', crypt('123456', gen_salt('bf', 10)), 'Marta Sánchez', 'cliente', true, 1),
(6, 'carlos@upse.edu.ec', crypt('123456', gen_salt('bf', 10)), 'Carlos Ruiz', 'cliente', true, 3),
(7, 'sofia@upse.edu.ec', crypt('123456', gen_salt('bf', 10)), 'Sofía León', 'cliente', true, 3),
(8, 'marco@upse.edu.ec', crypt('123456', gen_salt('bf', 10)), 'Marco Díaz', 'cliente', true, 4),
(9, 'diana@upse.edu.ec', crypt('123456', gen_salt('bf', 10)), 'Diana Paz', 'cliente', true, 6)
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, nombre = EXCLUDED.nombre;

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- Insertar nodos en referidos vinculados 1:1 con sus usuarios
INSERT INTO referidos (id, usuario_id, codigo, parent_id, nivel, ventas) VALUES
(1, 1, 'TU', NULL, 0, 2400),
(2, 2, 'CLIENTE', 1, 1, 100),
(3, 3, 'ANA', 1, 1, 1200),
(4, 4, 'LUIS', 1, 1, 850),
(5, 5, 'MARTA', 1, 1, 430),
(6, 6, 'CARLOS', 3, 2, 500),
(7, 7, 'SOFIA', 3, 2, 430),
(8, 8, 'MARCO', 4, 2, 380),
(9, 9, 'DIANA', 6, 3, 300)
ON CONFLICT (usuario_id) DO UPDATE 
SET codigo = EXCLUDED.codigo, parent_id = EXCLUDED.parent_id, ventas = EXCLUDED.ventas;

SELECT setval('referidos_id_seq', (SELECT MAX(id) FROM referidos));

-- Insertar productos iniciales
INSERT INTO productos (nombre, descripcion, precio, stock, categoria, img, activo) VALUES
('Serum Revitalizante', 'Fórmula concentrada con ácido hialurónico y vitamina C para revitalizar tu piel.', 45.00, 100, 'Facial', 'https://picsum.photos/seed/serum/150', true),
('Crema Hidratante Pro', 'Hidratación profunda 24h para todo tipo de piel.', 32.50, 100, 'Cuidado Diario', 'https://picsum.photos/seed/crema/150', true),
('Tónico Purificante', 'Equilibra el pH y minimiza los poros suavemente.', 28.00, 100, 'Limpieza', 'https://picsum.photos/seed/tonico/150', true),
('Mascarilla Nocturna', 'Nutrición intensiva durante el sueño con extractos botánicos.', 50.00, 100, 'Tratamiento', 'https://picsum.photos/seed/mascarilla/150', true)
ON CONFLICT DO NOTHING;

-- Insertar comisiones iniciales para visualización
INSERT INTO comisiones (pedido_id, referido_id, nivel, porcentaje, monto, estado) VALUES
(NULL, 3, 1, 10.00, 120.00, 'pendiente'),
(NULL, 4, 1, 10.00, 85.00, 'pendiente'),
(NULL, 5, 1, 10.00, 43.00, 'pendiente'),
(NULL, 6, 2, 5.00, 25.00, 'pendiente')
ON CONFLICT DO NOTHING;
