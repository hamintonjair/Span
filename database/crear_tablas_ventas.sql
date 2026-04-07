-- Crear tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    cliente_id UUID NULL,
    empleado_id UUID NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo',
    impuestos DECIMAL(10,2) NOT NULL DEFAULT 0,
    descuentos DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'completada',
    cita_id UUID NULL,
    creado_por UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de detalles de venta
CREATE TABLE IF NOT EXISTS ventas_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID NULL REFERENCES productos(id) ON DELETE SET NULL,
    servicio_id UUID NULL REFERENCES servicios(id) ON DELETE SET NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    empleado_id UUID NULL,
    cita_id UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_empresa_id ON ventas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_empleado_id ON ventas(empleado_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cita_id ON ventas(cita_id);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON ventas(created_at);

CREATE INDEX IF NOT EXISTS idx_ventas_detalle_venta_id ON ventas_detalle(venta_id);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_producto_id ON ventas_detalle(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_servicio_id ON ventas_detalle(servicio_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_detalle ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para ventas
CREATE POLICY "Users can view own company sales" ON ventas
    FOR SELECT USING (empresa_id = auth.uid());

CREATE POLICY "Users can insert own company sales" ON ventas
    FOR INSERT WITH CHECK (empresa_id = auth.uid());

CREATE POLICY "Users can update own company sales" ON ventas
    FOR UPDATE USING (empresa_id = auth.uid());

-- Políticas de RLS para ventas_detalle
CREATE POLICY "Users can view own company sale details" ON ventas_detalle
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM ventas v 
        WHERE v.id = ventas_detalle.venta_id 
        AND v.empresa_id = auth.uid()
    ));

CREATE POLICY "Users can insert own company sale details" ON ventas_detalle
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM ventas v 
        WHERE v.id = ventas_detalle.venta_id 
        AND v.empresa_id = auth.uid()
    ));

CREATE POLICY "Users can update own company sale details" ON ventas_detalle
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM ventas v 
        WHERE v.id = ventas_detalle.venta_id 
        AND v.empresa_id = auth.uid()
    ));
