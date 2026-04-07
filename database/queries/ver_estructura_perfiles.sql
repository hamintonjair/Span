-- ============================================
-- Verificar estructura de la tabla perfiles
-- ============================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'perfiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- Verificar si existe la tabla perfiles
-- ============================================

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'perfiles'
) as tabla_existe;

-- ============================================
-- Ver primeros registros (si existen)
-- ============================================

SELECT * FROM perfiles LIMIT 5;
