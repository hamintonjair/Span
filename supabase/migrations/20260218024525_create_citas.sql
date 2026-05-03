-- Crear tabla de citas
CREATE TABLE IF NOT EXISTS citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    notas TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    servicios_ids TEXT[], -- Array de UUIDs de servicios
    total_estimado DECIMAL(10,2) NOT NULL DEFAULT 0,
    duracion_minutos INTEGER NOT NULL DEFAULT 30
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_citas_empresa_id ON citas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_citas_cliente_id ON citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_empleado_id ON citas(empleado_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_citas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER citas_updated_at
    BEFORE UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION handle_citas_updated_at();
