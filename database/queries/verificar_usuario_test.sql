-- ============================================
-- Verificar si test@salon.com existe en auth.users
-- ============================================

SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    raw_user_meta_data,
    is_anonymous
FROM auth.users 
WHERE email = 'test@salon.com';

-- ============================================
-- Verificar si tiene perfil en perfiles
-- ============================================

SELECT 
    p.id,
    p.nombre,
    p.email,
    p.rol,
    p.empresa_id,
    p.creado_en,
    e.nombre as nombre_empresa
FROM perfiles p
LEFT JOIN empresas e ON p.empresa_id = e.id
WHERE p.email = 'test@salon.com';

-- ============================================
-- Verificar estado completo del usuario
-- ============================================

SELECT 
    u.id as auth_id,
    u.email as email_auth,
    u.created_at as fecha_registro_auth,
    u.email_confirmed_at as email_confirmado,
    u.last_sign_in_at as ultimo_login,
    CASE 
        WHEN p.id IS NOT NULL THEN 'TIENE_PERFIL'
        ELSE 'SIN_PERFIL'
    END as estado_perfil,
    p.rol,
    p.nombre as nombre_perfil
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
WHERE u.email = 'test@salon.com';
