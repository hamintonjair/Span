-- Crear tabla de movimientos de caja
CREATE TABLE IF NOT EXISTS movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    caja_id UUID NOT NULL REFERENCES cajas(id),
    categoria VARCHAR(100) NOT NULL,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    descripcion TEXT,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'otro')),
    referencia_id UUID,
    referencia_tipo VARCHAR(50)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_empresa_id ON movimientos_caja(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_caja_id ON movimientos_caja(caja_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_tipo ON movimientos_caja(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_fecha ON movimientos_caja(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_categoria ON movimientos_caja(categoria);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_referencia ON movimientos_caja(referencia_id, referencia_tipo);
