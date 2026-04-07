-- Crear bucket 'comprobantes' en Supabase Storage
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
VALUES (
    'comprobantes',
    'comprobantes',
    'auth.uid()',
    true,
    5242880, -- 5MB en bytes
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acceso para el bucket
-- Política para que los usuarios autenticados puedan subir archivos
CREATE POLICY "Users can upload their own company receipts" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

-- Política para que los usuarios autenticados puedan leer sus propios archivos
CREATE POLICY "Users can read their own company receipts" ON storage.objects
FOR SELECT USING (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

-- Política para que los usuarios puedan actualizar sus propios archivos
CREATE POLICY "Users can update their own company receipts" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

-- Política para que los usuarios puedan eliminar sus propios archivos
CREATE POLICY "Users can delete their own company receipts" ON storage.objects
FOR DELETE USING (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

-- Habilitar RLS (Row Level Security) para storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Comentarios para documentación
COMMENT ON STORAGE BUCKET comprobantes IS 'Bucket para almacenar comprobantes de pago de las empresas';

-- Verificar que el bucket fue creado
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'comprobantes';
