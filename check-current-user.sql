-- Verificar el rol del usuario actual logueado
-- Ejecutar en Supabase SQL Editor

-- Verificar todos los usuarios existentes
SELECT id, email, nombre, rol, empresa_id, created_at 
FROM usuarios_sistema 
ORDER BY created_at DESC;

-- Si necesitas actualizar tu rol a admin_global:
-- UPDATE usuarios_sistema 
-- SET rol = 'admin_global', empresa_id = NULL 
-- WHERE email = 'tu-email-actual@ejemplo.com';

-- Para verificar qué usuarios son admin_global:
SELECT * FROM usuarios_sistema WHERE rol = 'admin_global';
