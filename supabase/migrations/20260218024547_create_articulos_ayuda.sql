-- Crear tabla de ayuda/artículos de soporte
CREATE TABLE IF NOT EXISTS articulos_ayuda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'archivado')),
    autor_id UUID NOT NULL REFERENCES usuarios_staff(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    imagen_url TEXT,
    video_url TEXT
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_ayuda_categoria ON ayuda(categoria);
CREATE INDEX IF NOT EXISTS idx_ayuda_estado ON ayuda(estado);
CREATE INDEX IF NOT EXISTS idx_ayuda_autor_id ON ayuda(autor_id);
CREATE INDEX IF NOT EXISTS idx_ayuda_creado_en ON ayuda(creado_en);
CREATE INDEX IF NOT EXISTS idx_ayuda_actualizado_en ON ayuda(actualizado_en);

-- Crear trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION handle_ayuda_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ayuda_updated_at
    BEFORE UPDATE ON ayuda
    FOR EACH ROW
    EXECUTE FUNCTION handle_ayuda_updated_at();
