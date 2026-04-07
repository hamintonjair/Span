-- ============================================
-- Crear Usuario en auth.users y Perfil correspondiente
-- ============================================

-- Paso 1: Crear usuario en auth.users
INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_user_meta_data,
    is_anonymous
) VALUES (
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@beautypro.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJg/8K2',  -- hash para 'test123'
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Usuario Test"}',
    false
) RETURNING id as usuario_id;

-- Paso 2: Crear perfil correspondiente
INSERT INTO perfiles (
    id,
    empresa_id,
    nombre,
    email,
    telefono,
    rol,
    created_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'test@beautypro.com' LIMIT 1),
    'dd1801b0-42de-432f-89d9-f508796162db',  -- ID de la empresa existente
    'Usuario Test',
    'test@beautypro.com',
    '+52 555 0123',
    'admin_empresa',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar que ambos se crearon
SELECT 
    u.id as usuario_id,
    u.email as usuario_email,
    p.id as perfil_id,
    p.nombre as perfil_nombre,
    p.rol as perfil_rol
FROM auth.users u
JOIN perfiles p ON u.id = p.id
WHERE u.email = 'test@beautypro.com';
