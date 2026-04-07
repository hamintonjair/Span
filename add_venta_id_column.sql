-- Agregar columna venta_id a la tabla citas
-- Esta columna permitirá vincular una cita con su venta correspondiente

ALTER TABLE citas 
ADD COLUMN venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL;

-- Crear índice para mejorar rendimiento
CREATE INDEX idx_citas_venta_id ON citas(venta_id);

-- Comentario sobre la columna
COMMENT ON COLUMN citas.venta_id IS 'ID de la venta asociada para reimprimir factura';
