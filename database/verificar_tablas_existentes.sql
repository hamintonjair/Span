-- Script para verificar las tablas existentes en tu base de datos

-- 1. Verificar todas las tablas
SELECT 
    table_name,
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar columnas de la tabla servicios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'servicios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar columnas de la tabla usuarios_sistema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios_sistema' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar si existe la tabla ventas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ventas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar si existe la tabla detalles_ventas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'detalles_ventas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar nombres similares que podrían existir
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name LIKE '%venta%' 
    OR table_name LIKE '%detalle%'
    OR table_name LIKE '%usuario%'
    OR table_name LIKE '%cita%'
)
ORDER BY table_name;
