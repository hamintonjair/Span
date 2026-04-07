-- ============================================
-- Obtener ID del Usuario test@beautypro.com
-- ============================================

SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'test@beautypro.com';
