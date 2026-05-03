-- Crear tabla de enlace cita_productos
CREATE TABLE IF NOT EXISTS cita_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_id UUID NOT NULL REFERENCES citas(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    precio_unitario DECIMAL(10,2) NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_cita_productos_cita_id ON cita_productos(cita_id);
CREATE INDEX IF NOT EXISTS idx_cita_productos_producto_id ON cita_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_cita_productos_created_at ON cita_productos(created_at);

-- Crear trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION handle_cita_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
