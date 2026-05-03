-- Crear tabla de detalles de ventas
CREATE TABLE IF NOT EXISTS detalles_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cantidad INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    venta_id UUID NOT NULL REFERENCES ventas(id),
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    producto_id UUID REFERENCES productos(id),
    servicio_id UUID REFERENCES servicios(id),
    precio_unitario DECIMAL(10,2) NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_detalles_ventas_venta_id ON detalles_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalles_ventas_producto_id ON detalles_ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_detalles_ventas_servicio_id ON detalles_ventas(servicio_id);
CREATE INDEX IF NOT EXISTS idx_detalles_ventas_created_at ON detalles_ventas(created_at);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_detalles_ventas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER detalles_ventas_updated_at
    BEFORE UPDATE ON detalles_ventas
    FOR EACH ROW
    EXECUTE FUNCTION handle_detalles_ventas_updated_at();
