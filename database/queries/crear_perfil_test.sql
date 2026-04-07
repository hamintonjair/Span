-- ============================================
-- Crear Perfil para test@salon.com
-- ============================================

-- Reemplaza 'UUID_DEL_USUARIO_TEST' con el ID real del usuario
-- Obtén el ID desde Authentication → Users → Click en test@salon.com

-- Primero creamos una empresa para el test
INSERT INTO empresas (
    id,
    nombre,
    plan_id,
    estado_suscripcion,
    fecha_vencimiento,
    created_at
) VALUES (
    gen_random_uuid(),
    'Salón Test Principal',
    'basico',
    'activa',
    '2024-12-31',
    NOW()
) RETURNING id as empresa_test_id;

-- Luego creamos el perfil del usuario
INSERT INTO perfiles (
    id,                    -- ← REEMPLAZAR con ID de test@salon.com
    empresa_id,             -- ← Usaremos la empresa creada arriba
    nombre,
    email,
    telefono,
    rol,
    creado_en
) VALUES (
    'UUID_DEL_USUARIO_TEST', -- ← REEMPLAZAR ESTO
    (SELECT id FROM empresas WHERE nombre = 'Salón Test Principal' LIMIT 1),
    'Usuario Test',
    'test@salon.com',
    '+52 555 0123',
    'admin_empresa',  -- O 'estilista' según prefieras
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verificar que todo se creó correctamente
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
WHERE u.email = 'test@salon.com';
