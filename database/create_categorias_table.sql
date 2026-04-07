-- Crear tabla de categorías para clasificar servicios y productos
CREATE TABLE categorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_categorias_empresa_id ON categorias(empresa_id);
CREATE INDEX idx_categorias_nombre ON categorias(nombre);

-- Crear trigger para actualizar created_at automáticamente (opcional)
CREATE OR REPLACE FUNCTION update_created_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_created_at 
    BEFORE INSERT ON categorias 
    FOR EACH ROW 
    EXECUTE FUNCTION update_created_at_column();

-- Comentario explicando el uso futuro
COMMENT ON TABLE categorias IS 'Tabla maestra de categorías para clasificar servicios y productos. El ID de estas categorías se usará como Foreign Key en las tablas de servicios y productos.';
