-- Crear tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
    caja_id UUID REFERENCES cajas(id),
    cita_id UUID REFERENCES citas(id),
    propina DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) NOT NULL DEFAULT 0,
    cliente_id UUID REFERENCES clientes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    descuentos DECIMAL(10,2) NOT NULL DEFAULT 0,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
    vendedor_id UUID NOT NULL REFERENCES usuarios_sistema(id),
    numero_factura VARCHAR(50) UNIQUE
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_empresa_id ON ventas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ventas_caja_id ON ventas(caja_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor_id ON ventas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_numero_factura ON ventas(numero_factura);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_ventas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ventas_updated_at
    BEFORE UPDATE ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION handle_ventas_updated_at();
