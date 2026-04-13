-- Crear usuario admin global
-- Ejecutar en Supabase SQL Editor

-- Verificar si ya existe
SELECT * FROM usuarios_sistema WHERE rol = 'admin_global';

-- Crear usuario admin global si no existe
INSERT INTO usuarios_sistema (
  id,
  email,
  nombre,
  rol,
  empresa_id,
  password_hash,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin@beautypro.com',
  'Administrador Global',
  'admin_global',
  NULL,  -- Sin empresa para admin global
  '$2a$10$rQZ8kHWKqGYQ4qTzHq5Y5.GXrKJIYvM/9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q',
  NOW()
) ON CONFLICT (email) DO NOTHING;
