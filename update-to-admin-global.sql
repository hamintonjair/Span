-- Actualizar tu rol a admin_global
-- Reemplaza 'tu-email-actual@ejemplo.com' con tu email real

UPDATE usuarios_sistema 
SET rol = 'admin_global', empresa_id = NULL 
WHERE email = 'tu-email-actual@ejemplo.com';

-- Verificar que el cambio se aplicó
SELECT id, email, nombre, rol, empresa_id 
FROM usuarios_sistema 
WHERE email = 'tu-email-actual@ejemplo.com';
