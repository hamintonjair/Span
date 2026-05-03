-- Crear tabla de cajas
CREATE TABLE IF NOT EXISTS cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estado VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
    creado_por UUID NOT NULL REFERENCES usuarios_sistema(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    monto_final DECIMAL(15,2),
    vendedor_id UUID REFERENCES usuarios_sistema(id),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    monto_cierre DECIMAL(15,2),
    fecha_apertura TIMESTAMP WITH TIME ZONE,
    monto_apertura DECIMAL(15,2) NOT NULL DEFAULT 0,
    monto_esperado DECIMAL(15,2)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_cajas_empresa_id ON cajas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cajas_estado ON cajas(estado);
CREATE INDEX IF NOT EXISTS idx_cajas_vendedor_id ON cajas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_cajas_fecha_apertura ON cajas(fecha_apertura);
CREATE INDEX IF NOT EXISTS idx_cajas_fecha_cierre ON cajas(fecha_cierre);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_cajas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cajas_updated_at
    BEFORE UPDATE ON cajas
    FOR EACH ROW
    EXECUTE FUNCTION handle_cajas_updated_at();
