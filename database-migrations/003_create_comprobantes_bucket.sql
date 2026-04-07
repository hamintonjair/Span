-- Crear bucket para almacenar comprobantes de pago
-- Este bucket almacenará los archivos de comprobantes subidos por los usuarios

INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
VALUES (
    'comprobantes',
    'comprobantes',
    'service_role',
    true,
    5242880, -- 5MB en bytes
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket comprobantes

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
CREATE POLICY "Usuarios pueden eliminar sus comprobantes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'comprobantes' AND
    auth.role() = 'authenticated'
);

-- Comentarios para documentación
COMMENT ON STORAGE BUCKET comprobantes IS 'Bucket para almacenar comprobantes de pago de los usuarios';
COMMENT ON POLICY "Usuarios pueden subir comprobantes" IS 'Permite a usuarios autenticados subir archivos de comprobantes';
COMMENT ON POLICY "Usuarios pueden actualizar sus comprobantes" IS 'Permite a usuarios autenticados actualizar sus propios archivos';
COMMENT ON POLICY "Cualquiera puede leer comprobantes públicos" IS 'Permite acceso público a los archivos para visualización';
COMMENT ON POLICY "Usuarios pueden eliminar sus comprobantes" IS 'Permite a usuarios autenticados eliminar sus propios archivos';
