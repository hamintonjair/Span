-- Crear tabla de préstamos
CREATE TABLE IF NOT EXISTS prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'vencido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    descripcion TEXT,
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    monto_total DECIMAL(10,2) NOT NULL,
    fecha_limite DATE NOT NULL,
    cuota_mensual DECIMAL(10,2) NOT NULL,
    fecha_prestamo DATE NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_prestamos_empresa_id ON prestamos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_empleado_id ON prestamos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha_prestamo ON prestamos(fecha_prestamo);
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha_limite ON prestamos(fecha_limite);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_prestamos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prestamos_updated_at
    BEFORE UPDATE ON prestamos
    FOR EACH ROW
    EXECUTE FUNCTION handle_prestamos_updated_at();
