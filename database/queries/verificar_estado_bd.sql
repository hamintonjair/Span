-- ============================================
-- Verificar Estado de la Base de Datos
-- ============================================

-- Verificar si la tabla auth.users existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) as auth_users_existe;

-- Verificar si hay restricciones en auth.users
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'auth' 
AND table_name = 'users';

-- Verificar políticas de RLS en auth.users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'auth';

-- Verificar si hay usuarios existentes
SELECT COUNT(*) as total_users FROM auth.users;
