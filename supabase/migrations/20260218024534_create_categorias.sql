-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    descripcion TEXT
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_categorias_empresa_id ON categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_nombre ON categorias(nombre);

-- Crear trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION handle_categorias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
