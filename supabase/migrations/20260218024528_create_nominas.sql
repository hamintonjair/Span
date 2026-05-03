-- Crear tabla de nóminas
CREATE TABLE IF NOT EXISTS nominas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'cancelado')),
    fecha_fin DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    metodo_pago VARCHAR(50) DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'otro')),
    sueldo_base DECIMAL(10,2) NOT NULL,
    total_pagar DECIMAL(10,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    periodo_tipo VARCHAR(20) DEFAULT 'semanal' CHECK (periodo_tipo IN ('semanal', 'quincenal', 'mensual')),
    total_comisiones DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_nominas_empresa_id ON nominas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nominas_empleado_id ON nominas(empleado_id);
CREATE INDEX IF NOT EXISTS idx_nominas_estado ON nominas(estado);
CREATE INDEX IF NOT EXISTS idx_nominas_fecha_inicio ON nominas(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_nominas_fecha_fin ON nominas(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_nominas_periodo_tipo ON nominas(periodo_tipo);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_nominas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nominas_updated_at
    BEFORE UPDATE ON nominas
    FOR EACH ROW
    EXECUTE FUNCTION handle_nominas_updated_at();
