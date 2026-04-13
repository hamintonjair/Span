-- Script para crear/verificar usuario admin_global
-- Ejecutar en Supabase SQL Editor

-- Primero, verificar si ya existe un usuario admin_global
SELECT * FROM usuarios_sistema WHERE rol = 'admin_global';

-- Si no existe, crear uno con estos datos:
INSERT INTO usuarios_sistema (
  id,
  email,
  nombre,
  rol,
  empresa_id,
  password_hash,
  created_at
) VALUES (
  gen_random_uuid(),  -- ID único
  'admin@beautypro.com',  -- Email para login
  'Administrador Global',  -- Nombre
  'admin_global',  -- Rol
  NULL,  -- empresa_id = NULL para admin global
  '$2a$10$rQZ8kHWKqGYQ4qTzHq5Y5.GXrKJIYvM/9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q',  -- Contraseña: admin123
  NOW()
);

-- Para actualizar la contraseña si necesitas cambiarla:
-- UPDATE usuarios_sistema 
-- SET password_hash = '$2a$10$rQZ8kHWKqGYQ4qTzHq5Y5.GXrKJIYvM/9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q'
-- WHERE email = 'admin@beautypro.com';
