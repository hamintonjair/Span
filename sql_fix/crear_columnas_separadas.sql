-- Solo crear la columna monto_apertura que definitivamente falta
ALTER TABLE cajas 
ADD COLUMN monto_apertura DECIMAL(10,2) DEFAULT 0;

-- Verificar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'cajas'
ORDER BY ordinal_position;

-- Si las otras columnas ya existen, no intentes crearlas
-- Si alguna de estas falla, ignórala porque ya existe
DO $$
BEGIN
    -- Intentar crear monto_cierre si no existe
    BEGIN
        ALTER TABLE cajas ADD COLUMN monto_cierre DECIMAL(10,2);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Intentar crear monto_esperado si no existe
    BEGIN
        ALTER TABLE cajas ADD COLUMN monto_esperado DECIMAL(10,2);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;
