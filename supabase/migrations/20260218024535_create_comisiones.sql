-- Crear tabla de comisiones
CREATE TABLE IF NOT EXISTS comisiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'cancelado')),
    venta_id UUID REFERENCES ventas(id),
    nomina_id UUID REFERENCES nominas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    monto_base DECIMAL(10,2) NOT NULL,
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    monto_comision DECIMAL(10,2) NOT NULL,
    porcentaje_aplicado DECIMAL(5,2) NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_comisiones_empresa_id ON comisiones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_empleado_id ON comisiones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_venta_id ON comisiones(venta_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_nomina_id ON comisiones(nomina_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_estado ON comisiones(estado);
CREATE INDEX IF NOT EXISTS idx_comisiones_created_at ON comisiones(created_at);

-- Crear trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION handle_comisiones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
