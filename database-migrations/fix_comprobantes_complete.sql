-- =================================================================
-- SOLUCIÓN COMPLETA PARA ERRORES DE COMPROBANTES
-- Ejecutar en orden para resolver todos los problemas
-- =================================================================

-- 1. AGREGAR COLUMNAS FALTANTES A COMPROBANTES
-- ================================================
DO $$
BEGIN
    -- Agregar columna monto si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comprobantes' 
        AND column_name = 'monto'
    ) THEN
        ALTER TABLE comprobantes ADD COLUMN monto DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        RAISE NOTICE '✅ Columna monto agregada a comprobantes';
    END IF;

    -- Agregar columna plan_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comprobantes' 
        AND column_name = 'plan_id'
    ) THEN
        ALTER TABLE comprobantes ADD COLUMN plan_id UUID REFERENCES planes(id);
        RAISE NOTICE '✅ Columna plan_id agregada a comprobantes';
    END IF;

    -- Agregar columna url_publica si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comprobantes' 
        AND column_name = 'url_publica'
    ) THEN
        ALTER TABLE comprobantes ADD COLUMN url_publica TEXT;
        RAISE NOTICE '✅ Columna url_publica agregada a comprobantes';
    END IF;
END $$;

-- 2. CREAR ÍNDICES PARA RENDIMIENTO
-- ==================================
CREATE INDEX IF NOT EXISTS idx_comprobantes_plan_id ON comprobantes(plan_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_monto ON comprobantes(monto);

-- 3. CREAR BUCKET DE STORAGE SI NO EXISTE
-- ============================================
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
VALUES (
    'comprobantes',
    'comprobantes',
    'service_role',
    true,
    5242880, -- 5MB en bytes
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 4. CONFIGURAR POLÍTICAS DEL BUCKET
-- ==================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden subir comprobantes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar susprobantes" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede leer comprobantes públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar comprobantes" ON storage.objects;

-- Crear políticas nuevas
CREATE POLICY "Usuarios pueden subir comprobantes" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Cualquiera puede leer comprobantes públicos" ON storage.objects
FOR SELECT USING (
    bucket_id = 'comprobantes' AND
    public = true
);

-- 5. VERIFICAR ESTRUCTURA FINAL
-- ================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'comprobantes' 
    AND column_name IN ('id', 'empresa_id', 'plan_id', 'nombre_archivo', 'url_archivo', 'tamano_bytes', 'monto', 'estado', 'notas', 'fecha_envio')
ORDER BY column_name;

-- 6. VERIFICAR BUCKET
-- ===================
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'comprobantes';

-- 7. REFORZAR PERMISOS
-- ======================
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;

-- 8. REFRESCAR CACHÉ DE POSTGREST
-- ==================================
NOTIFY pgrst, 'reload schema';

-- 9. ACTUALIZAR ESTADÍSTICAS
-- ==========================
ANALYZE comprobantes;
ANALYZE storage.buckets;

-- 10. MENSAJE FINAL
-- =================
DO $$
BEGIN
    RAISE NOTICE '🎉 Migración completada. Estructura de comprobantes actualizada correctamente.';
    RAISE NOTICE '📁 Bucket comprobantes creado y configurado.';
    RAISE NOTICE '🔄 Caché de PostgREST refrescado.';
END $$;
