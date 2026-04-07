-- ============================================
-- Verificar Usuario y Perfil para Login
-- ============================================

-- Verificar que el usuario existe en auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'test@beautypro.com';

-- Verificar que el perfil existe y está correcto
SELECT 
    p.id,
    p.nombre,
    p.email,
    p.rol,
    p.empresa_id,
    e.nombre as empresa_nombre,
    e.estado_suscripcion,
    e.fecha_vencimiento
FROM perfiles p
JOIN empresas e ON p.empresa_id = e.id
WHERE p.email = 'test@beautypro.com';

-- Verificar si hay alguna restricción o política bloqueando
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles
FROM pg_policies 
WHERE tablename IN ('users', 'perfiles', 'empresas')
ORDER BY tablename, policyname;
