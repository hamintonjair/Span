-- Configurar RLS para storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can upload their own company receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own company receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own company receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own company receipts" ON storage.objects;

-- Políticas más permisivas para el bucket comprobantes
CREATE POLICY "Allow authenticated users to access comprobantes bucket" ON storage.objects
FOR ALL USING (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

-- Asegurar que el bucket exista o crearlo si no existe
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
VALUES (
    'comprobantes',
    'comprobantes',
    'auth.uid()',
    true,
    5242880, -- 5MB en bytes
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verificar configuración
SELECT 
    b.id as bucket_id,
    b.name as bucket_name,
    b.public as is_public,
    b.file_size_limit,
    b.allowed_mime_types,
    COUNT(p.policyname) as policies_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.tablename = 'storage.objects'
WHERE b.name = 'comprobantes'
GROUP BY b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types;
