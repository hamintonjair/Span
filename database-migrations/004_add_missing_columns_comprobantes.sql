-- Agregar columnas faltantes a la tabla comprobantes
-- Esta migración agrega las columnas necesarias para el nuevo flujo de cambio de planes

-- Agregar columna monto si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comprobantes' 
        AND column_name = 'monto'
    ) THEN
        ALTER TABLE comprobantes ADD COLUMN monto DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        COMMENT ON COLUMN comprobantes.monto IS 'Monto total del pago incluyendo IVA';
    END IF;
END $$;

-- Agregar columna plan_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comprobantes' 
        AND column_name = 'plan_id'
    ) THEN
        ALTER TABLE comprobantes ADD COLUMN plan_id UUID REFERENCES planes(id);
        COMMENT ON COLUMN comprobantes.plan_id IS 'ID del plan asociado al comprobante';
    END IF;
END $$;

-- Agregar columna url_publica si no existe (renombrar url_archivo)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comprobantes' 
        AND column_name = 'url_publica'
    ) THEN
        ALTER TABLE comprobantes ADD COLUMN url_publica TEXT;
        COMMENT ON COLUMN comprobantes.url_publica IS 'URL pública del archivo de comprobante';
        
        -- Si existe url_archivo, copiar los datos a url_publica
        UPDATE comprobantes SET url_publica = url_archivo WHERE url_archivo IS NOT NULL;
    END IF;
END $$;

-- Crear índice para la nueva columna plan_id
CREATE INDEX IF NOT EXISTS idx_comprobantes_plan_id ON comprobantes(plan_id);

-- Crear índice para la columna monto
CREATE INDEX IF NOT EXISTS idx_comprobantes_monto ON comprobantes(monto);

-- Refrescar la caché del esquema de la API
NOTIFY pgrst, 'reload schema';
