-- fix_encoding.sql - Corregir tildes y caracteres especiales en UTF-8
SET client_encoding = 'UTF8';

-- 1. Corregir nombres en usuarios
UPDATE usuarios SET nombre = 'Ana García' WHERE email = 'ana@upse.edu.ec';
UPDATE usuarios SET nombre = 'Luis Poveda' WHERE email = 'luis@upse.edu.ec';
UPDATE usuarios SET nombre = 'Marta Sánchez' WHERE email = 'marta@upse.edu.ec';
UPDATE usuarios SET nombre = 'Carlos Ruiz' WHERE email = 'carlos@upse.edu.ec';
UPDATE usuarios SET nombre = 'Sofía León' WHERE email = 'sofia@upse.edu.ec';
UPDATE usuarios SET nombre = 'Marco Díaz' WHERE email = 'marco@upse.edu.ec';
UPDATE usuarios SET nombre = 'Diana Paz' WHERE email = 'diana@upse.edu.ec';
UPDATE usuarios SET nombre = 'Administrador' WHERE email = 'admin@upse.edu.ec';
UPDATE usuarios SET nombre = 'Cliente Demo' WHERE email = 'cliente@upse.edu.ec';

-- 2. Corregir productos
UPDATE productos 
SET nombre = 'Serum Revitalizante',
    descripcion = 'Fórmula concentrada con ácido hialurónico y vitamina C para revitalizar tu piel.'
WHERE id = 1;

UPDATE productos 
SET nombre = 'Crema Hidratante Pro',
    descripcion = 'Hidratación profunda 24h para todo tipo de piel.'
WHERE id = 2;

UPDATE productos 
SET nombre = 'Tónico Purificante',
    descripcion = 'Equilibra el pH y minimiza los poros suavemente.'
WHERE id = 3;

UPDATE productos 
SET nombre = 'Mascarilla Nocturna',
    descripcion = 'Nutrición intensiva durante el sueño con extractos botánicos.'
WHERE id = 4;
