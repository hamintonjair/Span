-- ============================================
-- Crear Usuario Directamente en auth.users
-- ============================================

-- NOTA: Esto requiere permisos de administrador
-- Puede que no funcione si no tienes los permisos necesarios

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
    'admin@beautypro.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJg/8K2',  -- hash para 'admin123'
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Admin BeautyPro"}',
    false
) ON CONFLICT (email) DO NOTHING;

-- Verificar si se creó
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'admin@beautypro.com';
