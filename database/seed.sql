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

-- Insertar productos iniciales (12 productos de Skincare con temática botánica y naturaleza)
INSERT INTO productos (nombre, descripcion, precio, stock, categoria, img, activo) VALUES
('Serum Revitalizante', 'Fórmula concentrada con ácido hialurónico y vitamina C para revitalizar tu piel.', 45.00, 100, 'Facial', 'https://images.unsplash.com/photo-1617897903246-719242758050?w=500&auto=format&fit=crop&q=80', true),
('Crema Hidratante Pro', 'Hidratación profunda 24h para todo tipo de piel.', 32.50, 100, 'Cuidado Diario', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80', true),
('Tónico Purificante', 'Equilibra el pH y minimiza los poros suavemente.', 28.00, 100, 'Limpieza', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80', true),
('Mascarilla Nocturna', 'Nutrición intensiva durante el sueño con extractos botánicos.', 50.00, 100, 'Tratamiento', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80', true),
('Agua Micelar Botánica', 'Limpiador suave con extracto de manzanilla silvestre y aloe vera para calmar e hidratar.', 24.00, 85, 'Limpieza', 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&auto=format&fit=crop&q=80', true),
('Exfoliante Facial de Bambú', 'Micropartículas naturales de bambú y té verde para renovar la textura de la piel suavemente.', 36.00, 70, 'Exfoliación', 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=80', true),
('Bruma Facial de Rosas y Lavanda', 'Rocío refrescante con hidrolato de lavanda y agua de rosas orgánicas para tonificar.', 22.50, 95, 'Hidratación', 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=500&auto=format&fit=crop&q=80', true),
('Contorno de Ojos Cafeína Verde', 'Descongestiona ojeras y líneas finas con extracto de cafeína verde y pepino fresco.', 38.00, 60, 'Facial', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80', true),
('Aceite Facial Jojoba y Rosa Mosqueta', 'Elixir regenerador nocturno rico en antioxidantes y ácidos grasos esenciales.', 42.00, 75, 'Tratamiento', 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=500&auto=format&fit=crop&q=80', true),
('Protector Solar Mineral SPF 50+', 'Filtros minerales con acabado invisible, textura sedosa y protección de amplio espectro.', 34.50, 110, 'Cuidado Diario', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80', true),
('Mascarilla Arcilla Verde y Eucalipto', 'Purifica profundamente los poros y equilibra el exceso de brillo con eucalipto silvestre.', 29.00, 65, 'Tratamiento', 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&auto=format&fit=crop&q=80', true),
('Bálsamo Reparador Cica y Karité', 'Nutrición intensiva para labios con centella asiática y manteca de karité pura.', 16.50, 120, 'Cuidado Diario', 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=80', true)
ON CONFLICT DO NOTHING;

-- Insertar comisiones iniciales para visualización
INSERT INTO comisiones (pedido_id, referido_id, nivel, porcentaje, monto, estado) VALUES
(NULL, 3, 1, 10.00, 120.00, 'pendiente'),
(NULL, 4, 1, 10.00, 85.00, 'pendiente'),
(NULL, 5, 1, 10.00, 43.00, 'pendiente'),
(NULL, 6, 2, 5.00, 25.00, 'pendiente')
ON CONFLICT DO NOTHING;
