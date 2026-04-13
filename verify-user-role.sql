-- Verificar tu usuario actual y su rol
-- Ejecutar en Supabase SQL Editor

-- Ver todos los usuarios existentes
SELECT id, email, nombre, rol, empresa_id, created_at 
FROM usuarios_sistema 
ORDER BY created_at DESC;

-- Si tu rol no es admin_global, actualízalo con:
-- UPDATE usuarios_sistema 
-- SET rol = 'admin_global', empresa_id = NULL 
-- WHERE email = 'tu-email-actual@ejemplo.com';

-- Reemplaza 'tu-email-actual@ejemplo.com' con tu email real
