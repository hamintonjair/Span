-- ============================================
-- Crear Perfiles para los Usuarios Creados
-- ============================================

-- PASO 1: Reemplaza estos IDs con los IDs REALES de tus usuarios
-- Puedes obtenerlos desde Authentication → Users → Click en cada usuario

-- Perfil para Admin Global
INSERT INTO perfiles (
    id,                    -- ← REEMPLAZAR con ID de admin@beautypro.com
    empresa_id,             -- Admin global no tiene empresa
    nombre,
    email,
    telefono,
    rol,
    creado_en
) VALUES (
    'UUID_ADMIN_AQUI',       -- ← REEMPLAZAR ESTO
    NULL,
    'Admin BeautyPro',
    'admin@beautypro.com',
    '+52 555 0101',
    'admin_global',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- PASO 2: Primero creamos una empresa para el admin empresa
INSERT INTO empresas (
    id,
    nombre,
    plan_id,
    estado_suscripcion,
    fecha_vencimiento,
    created_at
) VALUES (
    gen_random_uuid(),
    'Salón Belleza Test',
    'basico',
    'activa',
    '2024-12-31',
    NOW()
) RETURNING id as empresa_id_creada;

-- PASO 3: Perfil para Admin Empresa
INSERT INTO perfiles (
    id,                    -- ← REEMPLAZAR con ID de empresa@beautypro.com
    empresa_id,             -- ← Usaremos el ID de la empresa creada arriba
    nombre,
    email,
    telefono,
    rol,
    creado_en
) VALUES (
    'UUID_EMPRESA_AQUI',    -- ← REEMPLAZAR ESTO
    (SELECT id FROM empresas WHERE nombre = 'Salón Belleza Test' LIMIT 1),
    'Carlos Dueño',
    'empresa@beautypro.com',
    '+52 555 0102',
    'admin_empresa',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verificar que los perfiles se crearon correctamente
-- ============================================

SELECT 
    u.email as email_auth,
    u.created_at as fecha_registro,
    p.id as perfil_id,
    p.nombre,
    p.email as email_perfil,
    p.rol,
    p.empresa_id,
    e.nombre as nombre_empresa,
    CASE 
        WHEN p.id IS NOT NULL THEN 'PERFIL_CREADO'
        ELSE 'SIN_PERFIL'
    END as estado_perfil
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
LEFT JOIN empresas e ON p.empresa_id = e.id
WHERE u.email IN ('admin@beautypro.com', 'empresa@beautypro.com')
ORDER BY u.created_at DESC;
