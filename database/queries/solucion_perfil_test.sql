-- ============================================
-- SOLUCIÓN: Crear Perfil para test@salon.com
-- ============================================

-- PASO 1: Reemplaza 'ID_REAL_DEL_USUARIO' con el ID que copiaste
-- El ID se ve en Authentication → Users → Click en test@salon.com

-- Crear empresa para el test (si no existe)
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
) ON CONFLICT DO NOTHING;

-- Crear perfil para test@salon.com
INSERT INTO perfiles (
    id,                    -- ← REEMPLAZAR CON ID REAL DEL USUARIO
    empresa_id,             
    nombre,
    email,
    telefono,
    rol,
    creado_en
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',  -- ← REEMPLAZAR ESTO CON EL ID COPIADO
    (SELECT id FROM empresas WHERE nombre = 'Salón Test Principal' LIMIT 1),
    'Usuario Test',
    'test@salon.com',
    '+52 555 0123',
    'admin_empresa',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verificación Final
-- ============================================

SELECT 
    u.email as email_auth,
    u.created_at as fecha_registro,
    u.email_confirmed_at as email_confirmado,
    p.id as perfil_id,
    p.nombre,
    p.email as email_perfil,
    p.rol,
    p.empresa_id,
    e.nombre as nombre_empresa,
    CASE 
        WHEN p.id IS NOT NULL THEN '✅ PERFIL_CREADO'
        ELSE '❌ SIN_PERFIL'
    END as estado_perfil
FROM auth.users u
LEFT JOIN perfiles p ON u.id = p.id
LEFT JOIN empresas e ON p.empresa_id = e.id
WHERE u.email = 'test@salon.com';
