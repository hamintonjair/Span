-- Crear tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notas TEXT,
    motivo VARCHAR(255),
    cantidad INTEGER NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL,
    creado_por UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    producto_id UUID NOT NULL REFERENCES productos(id),
    stock_nuevo INTEGER NOT NULL,
    referencia_id UUID,
    stock_anterior INTEGER NOT NULL,
    referencia_tipo VARCHAR(50),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida'))
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_empresa_id ON movimientos_inventario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto_id ON movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_tipo_movimiento ON movimientos_inventario(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_creado_en ON movimientos_inventario(creado_en);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_referencia ON movimientos_inventario(referencia_id, referencia_tipo);
