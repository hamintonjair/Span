-- Crear columna monto_apertura en la tabla cajas
ALTER TABLE cajas 
ADD COLUMN monto_apertura DECIMAL(10,2) DEFAULT 0;

-- También crear las otras columnas que podrían faltar
ALTER TABLE cajas 
ADD COLUMN monto_cierre DECIMAL(10,2);

ALTER TABLE cajas 
ADD COLUMN monto_esperado DECIMAL(10,2);

ALTER TABLE cajas 
ADD COLUMN fecha_cierre TIMESTAMP WITH TIME ZONE;

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'cajas'
ORDER BY ordinal_position;
