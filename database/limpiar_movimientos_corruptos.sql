-- Limpieza de movimientos corruptos en la base de datos
-- Este script corrige los movimientos que tienen campos NULL importantes

-- 1. Actualizar movimientos con tipo_movimiento NULL
UPDATE movimientos_inventario 
SET tipo_movimiento = 'Entrada',
    cantidad = CASE 
        WHEN cantidad IS NOT NULL AND cantidad > 0 THEN cantidad
        ELSE 1
    END,
    stock_anterior = CASE 
        WHEN stock_anterior IS NOT NULL AND stock_anterior > 0 THEN stock_anterior
        ELSE 0
    END,
    stock_nuevo = CASE 
        WHEN stock_nuevo IS NOT NULL AND stock_nuevo > 0 THEN stock_nuevo
        ELSE 0
    END
WHERE tipo_movimiento IS NULL 
   OR cantidad IS NULL 
   OR stock_anterior IS NULL 
   OR stock_nuevo IS NULL;

-- 2. Opcional: Eliminar movimientos completamente corruptos
-- Descomenta esta sección solo si quieres eliminar movimientos muy corruptos
-- DELETE FROM movimientos_inventario 
-- WHERE tipo_movimiento IS NULL 
--    OR cantidad IS NULL 
--    OR stock_anterior IS NULL 
--    OR stock_nuevo IS NULL;

-- 3. Verificación para confirmar la limpieza
SELECT 
    COUNT(*) as total_movimientos,
    COUNT(CASE WHEN tipo_movimiento IS NULL THEN 1 ELSE 0 END) as movimientos_sin_tipo,
    COUNT(CASE WHEN cantidad IS NULL THEN 1 ELSE 0 END) as movimientos_sin_cantidad,
    COUNT(CASE WHEN stock_anterior IS NULL THEN 1 ELSE 0 END) as movimientos_sin_stock_anterior,
    COUNT(CASE WHEN stock_nuevo IS NULL THEN 1 ELSE 0 END) as movimientos_sin_stock_nuevo
FROM movimientos_inventario
WHERE empresa_id = '397b41e4-cffb-4469-aeaf-f2b559f211dc';
