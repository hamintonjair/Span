-- ========================================
-- AGREGAR COLUMNAS DE MÓDULOS A TABLA PLANES
-- ========================================

-- Agregar columnas booleanas para cada módulo
ALTER TABLE planes 
ADD COLUMN IF NOT EXISTS tiene_inventario BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiene_comisiones BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiene_marketing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiene_nominas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tiene_analytics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS soporte_prioritario BOOLEAN DEFAULT false;

-- Actualizar planes existentes con valores por defecto según su tipo
UPDATE planes SET 
    tiene_inventario = true,
    tiene_comisiones = true,
    soporte_prioritario = true
WHERE nombre = 'Básico';

UPDATE planes SET 
    tiene_inventario = true,
    tiene_comisiones = true,
    tiene_marketing = false,
    tiene_analytics = false,
    soporte_prioritario = true
WHERE nombre = 'Profesional';

UPDATE planes SET 
    tiene_inventario = true,
    tiene_comisiones = true,
    tiene_marketing = true,
    tiene_analytics = true,
    tiene_nominas = true,
    soporte_prioritario = true
WHERE nombre = 'Empresarial';

-- Verificar la estructura actualizada
SELECT 
    nombre,
    tiene_inventario,
    tiene_comisiones,
    tiene_marketing,
    tiene_nominas,
    tiene_analytics,
    soporte_prioritario
FROM planes 
ORDER BY precio;
