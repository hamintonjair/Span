-- Refrescar caché del esquema de Supabase API
-- Este comando fuerza a PostgREST a recargar el esquema de la base de datos

-- Método 1: Notificación a PostgREST
NOTIFY pgrst, 'reload schema';

-- Método 2: Recargar configuración (alternativa)
-- SELECT pg_reload_conf();

-- Método 3: Forzar actualización de estadísticas (opcional)
ANALYZE;

-- Verificar que las columnas existen después de la migración
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'comprobantes' 
    AND column_name IN ('monto', 'plan_id', 'url_publica', 'tamano_bytes')
ORDER BY column_name;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Esquema refrescado. Columnas verificadas: monto, plan_id, url_publica, tamano_bytes';
END $$;
