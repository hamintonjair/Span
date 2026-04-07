-- ============================================
-- Crear Productos y Servicios de Prueba
-- ============================================

-- Crear servicio de prueba
INSERT INTO servicios (
    id,
    empresa_id,
    nombre,
    descripcion,
    precio,
    duracion_minutos,
    estado,
    created_at
) VALUES (
    'servicio-test-id',
    'c144a65b-6782-4788-8c0a-9cfb1dd653bc',  -- ID de la empresa creada
    'Corte de Cabello',
    'Corte completo con lavado y peinado',
    50.00,
    60,
    'activo',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Crear producto de prueba
INSERT INTO productos (
    id,
    empresa_id,
    nombre,
    descripcion,
    precio,
    stock_actual,
    stock_minimo,
    categoria_id,
    estado,
    created_at
) VALUES (
    'producto-test-id',
    'c144a65b-6782-4788-8c0a-9cfb1dd653bc',  -- ID de la empresa creada
    'Shampoo Profesional',
    'Shampoo de alta calidad para salón de belleza',
    25.00,
    100,
    10,
    'categoria-shampoo',
    'activo',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar que se crearon
SELECT 
    'Servicios' as tipo,
    s.id,
    s.nombre,
    s.precio
FROM servicios s
WHERE s.id = 'servicio-test-id'

UNION ALL

SELECT 
    'Productos' as tipo,
    p.id,
    p.nombre,
    p.precio,
    p.stock_actual
FROM productos p
WHERE p.id = 'producto-test-id';
