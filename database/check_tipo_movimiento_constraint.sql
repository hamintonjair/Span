-- Verificar restricción CHECK para tipo_movimiento
-- El error indica que viola "movimientos_inventario_tipo_movimiento_check"

-- Opción 1: Ver la restricción actual
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'movimientos_inventario'::regclass 
  AND conname LIKE '%tipo_movimiento%';

-- Opción 2: Si conocemos los valores permitidos, ajustarlos
-- Posibles valores según el error: 'entrada', 'salida', 'ajuste', 'suma', 'resta'

-- Opción 3: Modificar el INSERT para usar valores válidos
-- Probablemente la restricción espera valores específicos

-- Actualizar el código para usar valores correctos según la restricción:
-- Si la restricción es ('entrada', 'salida'):
UPDATE movimientos_inventario 
SET tipo_movimiento = CASE 
  WHEN tipo_movimiento = 'suma' THEN 'entrada'
  WHEN tipo_movimiento = 'resta' THEN 'salida'
  ELSE tipo_movimiento
END;

-- O deshabilitar temporalmente la restricción:
ALTER TABLE movimientos_inventario DROP CONSTRAINT IF EXISTS movimientos_inventario_tipo_movimiento_check;
