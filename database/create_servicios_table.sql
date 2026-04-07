-- Crear tabla de servicios para el salón de belleza
CREATE TABLE servicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL DEFAULT 0,
    comision_empleado NUMERIC(10,2) NOT NULL DEFAULT 0,
    duracion_minutos INTEGER NOT NULL DEFAULT 30,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_servicios_empresa_id ON servicios(empresa_id);
CREATE INDEX idx_servicios_categoria_id ON servicios(categoria_id);
CREATE INDEX idx_servicios_estado ON servicios(estado);
CREATE INDEX idx_servicios_nombre ON servicios(nombre);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_servicios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_servicios_updated_at 
    BEFORE UPDATE ON servicios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_servicios_updated_at();

-- Comentario explicando la relación con categorías
COMMENT ON TABLE servicios IS 'Tabla de servicios ofrecidos por el salón. Cada servicio está clasificado en una categoría y tiene precio, comisión y duración definidos.';
COMMENT ON COLUMN servicios.categoria_id IS 'Foreign Key a la tabla categorias. Clasifica el servicio (ej: Peluquería, Barbería, Uñas, etc.)';
COMMENT ON COLUMN servicios.comision_empleado IS 'Comisión que gana el empleado por realizar este servicio';
