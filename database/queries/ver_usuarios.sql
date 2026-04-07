-- ============================================
-- Consulta para Ver Todos los Usuarios con Perfiles
-- ============================================

SELECT 
    u.id as auth_id,
    u.email as email_auth,
    u.created_at as fecha_registro_auth,
    p.id as perfil_id,
    p.nombre,
    p.email as email_perfil,
    p.telefono,
    p.rol,
    p.empresa_id,
    e.nombre as nombre_empresa,
    p.creado_en as fecha_creacion_perfil
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
LEFT JOIN empresas e ON p.empresa_id = e.id
ORDER BY u.created_at DESC;

-- ============================================
-- Consulta para Ver Usuarios por Rol
-- ============================================

-- Admins Globales
SELECT 
    p.nombre,
    p.email,
    p.telefono,
    p.creado_en
FROM perfiles p
WHERE p.rol = 'admin_global'
ORDER BY p.creado_en DESC;

-- Admins de Empresas
SELECT 
    p.nombre,
    p.email,
    e.nombre as empresa,
    p.creado_en
FROM perfiles p
JOIN empresas e ON p.empresa_id = e.id
WHERE p.rol = 'admin_empresa'
ORDER BY p.creado_en DESC;

-- Estilistas
SELECT 
    p.nombre,
    p.email,
    e.nombre as empresa,
    p.creado_en
FROM perfiles p
JOIN empresas e ON p.empresa_id = e.id
WHERE p.rol = 'estilista'
ORDER BY p.creado_en DESC;

-- ============================================
-- Crear Usuario de Prueba (Admin Global)
-- ============================================

-- Paso 1: Crear usuario en auth.users (desde el panel de Supabase)
-- Paso 2: Crear perfil correspondiente
INSERT INTO perfiles (
    id,  -- Este ID debe ser el mismo que el de auth.users
    empresa_id,
    nombre,
    email,
    telefono,
    rol,
    creado_en
) VALUES (
    'UUID_DEL_USUARIO_CREADO_EN_AUTH',  -- Reemplazar con ID real
    NULL,  -- Admin global no tiene empresa
    'Admin BeautyPro',
    'admin@beautypro.com',
    '+52 123 456 7890',
    'admin_global',
    NOW()
);

-- ============================================
-- Verificar si un usuario tiene perfil
-- ============================================

SELECT 
    CASE 
        WHEN p.id IS NOT NULL THEN 'TIENE_PERFIL'
        ELSE 'SIN_PERFIL'
    END as estado_perfil,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
WHERE u.email = 'admin@beautypro.com';
