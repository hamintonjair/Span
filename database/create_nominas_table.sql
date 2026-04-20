-- Crear tabla nominas para el módulo de nómina
CREATE TABLE nominas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
    periodo_tipo TEXT NOT NULL CHECK (periodo_tipo IN ('diario', 'semanal', 'quincenal', 'mensual')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    sueldo_base NUMERIC NOT NULL DEFAULT 0,
    total_comisiones NUMERIC NOT NULL DEFAULT 0,
    total_pagar NUMERIC NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'pagado' CHECK (estado IN ('pendiente', 'pagado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_nominas_empresa_id ON nominas(empresa_id);
CREATE INDEX idx_nominas_empleado_id ON nominas(empleado_id);
CREATE INDEX idx_nominas_periodo_tipo ON nominas(periodo_tipo);
CREATE INDEX idx_nominas_estado ON nominas(estado);
CREATE INDEX idx_nominas_fecha_inicio ON nominas(fecha_inicio);
CREATE INDEX idx_nominas_fecha_fin ON nominas(fecha_fin);
CREATE INDEX idx_nominas_created_at ON nominas(created_at);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_nominas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_nominas
    BEFORE UPDATE ON nominas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at_nominas();

-- Comentarios para documentación
COMMENT ON TABLE nominas IS 'Tabla para registrar los pagos de nómina agrupando comisiones por periodos';
COMMENT ON COLUMN nominas.id IS 'Identificador único de la nómina';
COMMENT ON COLUMN nominas.empresa_id IS 'ID de la empresa a la que pertenece la nómina';
COMMENT ON COLUMN nominas.empleado_id IS 'ID del empleado que recibe el pago';
COMMENT ON COLUMN nominas.periodo_tipo IS 'Tipo de periodo: diario, semanal, quincenal, mensual';
COMMENT ON COLUMN nominas.fecha_inicio IS 'Fecha de inicio del periodo de pago';
COMMENT ON COLUMN nominas.fecha_fin IS 'Fecha de fin del periodo de pago';
COMMENT ON COLUMN nominas.sueldo_base IS 'Sueldo base del empleado para este periodo';
COMMENT ON COLUMN nominas.total_comisiones IS 'Total acumulado de comisiones para este periodo';
COMMENT ON COLUMN nominas.total_pagar IS 'Monto total a pagar (sueldo_base + total_comisiones)';
COMMENT ON COLUMN nominas.estado IS 'Estado de la nómina: pendiente, pagado';
COMMENT ON COLUMN nominas.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN nominas.updated_at IS 'Fecha de última actualización del registro';
