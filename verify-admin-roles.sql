-- Script para verificar y actualizar rol de usuario existente
-- Ejecutar en Supabase SQL Editor

-- Verificar todos los usuarios y sus roles
SELECT id, email, nombre, rol, empresa_id FROM usuarios_sistema;

-- Si necesitas actualizar un usuario existente a admin_global:
UPDATE usuarios_sistema 
SET rol = 'admin_global', 
    empresa_id = NULL 
WHERE email = 'tu-email@ejemplo.com';  -- Reemplaza con tu email

-- Para verificar que el cambio se aplicó:
SELECT id, email, nombre, rol, empresa_id 
FROM usuarios_sistema 
WHERE rol = 'admin_global';
