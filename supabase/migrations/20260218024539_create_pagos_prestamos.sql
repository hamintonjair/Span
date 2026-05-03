-- Crear tabla de pagos de préstamos
CREATE TABLE IF NOT EXISTS pagos_prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notas TEXT,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    fecha_pago TIMESTAMP WITH TIME ZONE NOT NULL,
    monto_pago DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'otro')),
    prestamo_id UUID NOT NULL REFERENCES prestamos(id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pagos_prestamos_empresa_id ON pagos_prestamos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagos_prestamos_prestamo_id ON pagos_prestamos(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_pagos_prestamos_fecha_pago ON pagos_prestamos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_prestamos_metodo_pago ON pagos_prestamos(metodo_pago);
