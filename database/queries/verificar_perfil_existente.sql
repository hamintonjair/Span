-- ============================================
-- Verificar si el perfil ya existe
-- ============================================

SELECT 
    p.id,
    p.nombre,
    p.email,
    p.rol,
    p.empresa_id,
    e.nombre as empresa_nombre
FROM perfiles p
JOIN empresas e ON p.empresa_id = e.id
WHERE p.id = '1d07dd17-b14c-47c8-a1b3-a74185abffe8';
