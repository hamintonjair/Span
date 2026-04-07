-- ============================================
-- Verificar si el usuario es admin_global
-- ============================================

SELECT 
    p.id,
    p.email,
    p.rol,
    p.empresa_id
FROM perfiles p
WHERE p.email = 'test@beautypro.com';
