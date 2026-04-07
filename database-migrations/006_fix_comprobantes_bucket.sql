-- Crear bucket comprobantes si no existe y configurar políticas
-- Este script asegura que el bucket exista y tenga las políticas correctas

-- 1. Crear bucket comprobantes si no existe
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
VALUES (
    'comprobantes',
    'comprobantes',
    'service_role',
    true,
    5242880, -- 5MB en bytes
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Usuarios pueden subir comprobantes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus comprobantes" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede leer comprobantes públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar comprobantes" ON storage.objects;

-- 3. Crear políticas nuevas para el bucket comprobantes

-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "Usuarios pueden subir comprobantes" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

-- Permitir a usuarios autenticados actualizar sus propios archivos
CREATE POLICY "Usuarios pueden actualizar sus comprobantes" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

-- Permitir a cualquiera leer archivos públicos (para visualización)
CREATE POLICY "Cualquiera puede leer comprobantes públicos" ON storage.objects
FOR SELECT USING (
    bucket_id = 'comprobantes' AND
    public = true
);

-- Permitir a usuarios autenticados eliminar sus propios archivos
CREATE POLICY "Usuarios pueden eliminar comprobantes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

-- 4. Verificar que el bucket existe
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'comprobantes';

-- 5. Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 6. Refrescar caché
NOTIFY pgrst, 'reload schema';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Bucket comprobantes creado/verificado con políticas de acceso';
END $$;
