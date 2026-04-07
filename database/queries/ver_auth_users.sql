-- ============================================
-- Consulta para Ver Usuarios en auth.users
-- ============================================

SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data,
    is_anonymous
FROM auth.users 
ORDER BY created_at DESC;

-- ============================================
-- Contar cuántos usuarios hay
-- ============================================

SELECT COUNT(*) as total_usuarios 
FROM auth.users;

-- ============================================
-- Ver usuarios por email específico
-- ============================================

SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email IN (
    'admin@beautypro.com',
    'empresa@beautypro.com', 
    'estilista@beautypro.com',
    'recepcionista@beautypro.com'
)
ORDER BY created_at DESC;

-- ============================================
-- Ver usuarios que tienen perfil
-- ============================================

SELECT 
    u.id,
    u.email,
    u.created_at as fecha_registro,
    CASE 
        WHEN p.id IS NOT NULL THEN 'TIENE_PERFIL'
        ELSE 'SIN_PERFIL'
    END as estado_perfil,
    p.rol,
    p.nombre as nombre_perfil
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
ORDER BY u.created_at DESC;
