-- Actualizar tabla logs_actividad para incluir las columnas faltantes
-- Verificar si las columnas existen primero
DO $$
BEGIN
    -- Agregar columna datos_anteriores si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs_actividad' 
        AND column_name = 'datos_anteriores'
    ) THEN
        ALTER TABLE logs_actividad 
        ADD COLUMN datos_anteriores JSONB;
    END IF;

    -- Agregar columna datos_nuevos si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs_actividad' 
        AND column_name = 'datos_nuevos'
    ) THEN
        ALTER TABLE logs_actividad 
        ADD COLUMN datos_nuevos JSONB;
    END IF;

    -- Agregar columna ip_address si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs_actividad' 
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE logs_actividad 
        ADD COLUMN ip_address VARCHAR(45);
    END IF;

    -- Agregar columna user_agent si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs_actividad' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE logs_actividad 
        ADD COLUMN user_agent TEXT;
    END IF;
END $$;

-- Verificar la estructura actual de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'logs_actividad' 
ORDER BY ordinal_position;
