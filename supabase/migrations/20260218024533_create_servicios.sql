-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    descripcion TEXT,
    categoria_id UUID REFERENCES categorias(id),
    duracion_minutos INTEGER NOT NULL DEFAULT 30,
    comision_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_servicios_empresa_id ON servicios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_servicios_estado ON servicios(estado);
CREATE INDEX IF NOT EXISTS idx_servicios_categoria_id ON servicios(categoria_id);
CREATE INDEX IF NOT EXISTS idx_servicios_nombre ON servicios(nombre);
CREATE INDEX IF NOT EXISTS idx_servicios_precio ON servicios(precio);
CREATE INDEX IF NOT EXISTS idx_servicios_duracion_minutos ON servicios(duracion_minutos);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_servicios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER servicios_updated_at
    BEFORE UPDATE ON servicios
    FOR EACH ROW
    EXECUTE FUNCTION handle_servicios_updated_at();
