-- Verificar y actualizar rol de usuario existente
SELECT id, email, nombre, rol, empresa_id FROM usuarios_sistema;

-- Actualizar tu usuario a admin global (reemplaza tu-email@ejemplo.com)
UPDATE usuarios_sistema 
SET rol = 'admin_global', empresa_id = NULL 
WHERE email = 'tu-email@ejemplo.com';
