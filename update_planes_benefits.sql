-- Script para agregar campos booleanos y descripcion a la tabla planes
-- Campos para controlar beneficios extra de cada plan

-- 1. Agregar los nuevos campos booleanos con valor por defecto false
ALTER TABLE planes 
ADD COLUMN tiene_inventario BOOLEAN DEFAULT FALSE,
ADD COLUMN tiene_comisiones BOOLEAN DEFAULT FALSE,
ADD COLUMN tiene_marketing BOOLEAN DEFAULT FALSE,
ADD COLUMN soporte_prioritario BOOLEAN DEFAULT FALSE;

-- 2. Agregar columna descripcion para guardar la descripción del plan
ALTER TABLE planes 
ADD COLUMN descripcion TEXT;

-- 3. Actualizar los registros existentes según los beneficios de cada plan

-- Plan Básico ($29.99): Todo en false
UPDATE planes 
SET 
    tiene_inventario = FALSE,
    tiene_comisiones = FALSE,
    tiene_marketing = FALSE,
    soporte_prioritario = FALSE,
    descripcion = 'Plan perfecto para pequeñas empresas que comienzan su digitalización. Incluye funciones básicas de gestión.'
WHERE precio = 29.99 OR nombre ILIKE '%básico%' OR nombre ILIKE '%basic%';

-- Plan Profesional ($79.99): tiene_inventario y tiene_comisiones en true
UPDATE planes 
SET 
    tiene_inventario = TRUE,
    tiene_comisiones = TRUE,
    tiene_marketing = FALSE,
    soporte_prioritario = FALSE,
    descripcion = 'Plan ideal para empresas en crecimiento. Incluye gestión de inventario y sistema de comisiones para empleados.'
WHERE precio = 79.99 OR nombre ILIKE '%profesional%' OR nombre ILIKE '%professional%';

-- Plan Empresarial ($199.99): Todos los campos en true
UPDATE planes 
SET 
    tiene_inventario = TRUE,
    tiene_comisiones = TRUE,
    tiene_marketing = TRUE,
    soporte_prioritario = TRUE,
    descripcion = 'Plan completo para grandes empresas. Incluye todos los módulos, marketing avanzado y soporte prioritario 24/7.'
WHERE precio = 199.99 OR nombre ILIKE '%empresarial%' OR nombre ILIKE '%enterprise%';

-- 4. Verificar los cambios
SELECT 
    id,
    nombre,
    precio,
    descripcion,
    tiene_inventario,
    tiene_comisiones,
    tiene_marketing,
    soporte_prioritario
FROM planes 
ORDER BY precio;
