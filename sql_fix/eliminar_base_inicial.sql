-- Eliminar columna base_inicial que está causando problemas
-- y usar solo monto_apertura para consistencia

-- Paso 1: Eliminar la columna base_inicial
ALTER TABLE cajas DROP COLUMN base_inicial;

-- Paso 2: Verificar la estructura final
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'cajas'
ORDER BY ordinal_position;

-- Paso 3: Actualizar datos existentes si es necesario
-- (opcional, solo si hay datos inconsistentes)
-- UPDATE cajas 
-- SET monto_apertura = 10000  -- o el valor correcto
-- WHERE base_inicial = 0 AND monto_apertura IS NULL;

-- Paso 4: Verificar datos actualizados
-- SELECT * FROM cajas WHERE estado = 'abierta';
