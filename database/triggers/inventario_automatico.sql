-- ============================================
-- Trigger Automático de Inventario - BeautyPro
-- ============================================
-- Este trigger se ejecuta después de cada venta
-- para actualizar automáticamente el stock de productos

-- 1. Función para actualizar inventario
CREATE OR REPLACE FUNCTION actualizar_inventario_venta()
RETURNS TRIGGER AS $$
DECLARE
    producto_actual RECORD;
    stock_actual INTEGER;
    stock_nuevo INTEGER;
    producto_nombre TEXT;
BEGIN
    -- Solo procesar si hay un producto_id (no es un servicio)
    IF NEW.producto_id IS NOT NULL THEN
        -- Obtener información actual del producto
        SELECT 
            p.stock,
            p.nombre
        INTO 
            stock_actual,
            producto_nombre
        FROM productos p
        WHERE p.id = NEW.producto_id;
        
        -- Calcular nuevo stock
        stock_nuevo := stock_actual - NEW.cantidad;
        
        -- Validación de stock negativo
        IF stock_nuevo < 0 THEN
            RAISE EXCEPTION 'No hay stock suficiente para el producto: % (Stock actual: %, Solicitado: %)', 
                producto_nombre, stock_actual, NEW.cantidad;
        END IF;
        
        -- Alerta de stock bajo (menos de 5 unidades)
        IF stock_nuevo <= 5 AND stock_nuevo > 0 THEN
            RAISE NOTICE '⚠️ ALERTA: Stock bajo para producto "%" - Stock restante: % unidades', 
                producto_nombre, stock_nuevo;
        END IF;
        
        -- Alerta de stock agotado
        IF stock_nuevo = 0 THEN
            RAISE NOTICE '🚨 ALERTA CRÍTICA: Producto "%" agotado - Reponer inventario urgentemente', 
                producto_nombre;
        END IF;
        
        -- Actualizar el stock del producto
        UPDATE productos 
        SET 
            stock = stock_nuevo,
            updated_at = NOW()
        WHERE id = NEW.producto_id;
        
        -- Registrar el movimiento de inventario (opcional)
        INSERT INTO movimientos_inventario (
            producto_id,
            tipo_movimiento,
            cantidad,
            stock_anterior,
            stock_nuevo,
            referencia_id,
            referencia_tipo,
            creado_en
        ) VALUES (
            NEW.producto_id,
            'venta',
            NEW.cantidad,
            stock_actual,
            stock_nuevo,
            NEW.venta_id,
            'venta_detalle',
            NOW()
        );
        
        -- Log de auditoría
        RAISE LOG '✅ Inventario actualizado: Producto: % | Vendido: % | Stock anterior: % | Stock nuevo: %',
            producto_nombre, NEW.cantidad, stock_actual, stock_nuevo;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear el trigger AFTER INSERT
DROP TRIGGER IF EXISTS trigger_actualizar_inventario_venta ON detalles_ventas;
CREATE TRIGGER trigger_actualizar_inventario_venta
AFTER INSERT ON detalles_ventas
FOR EACH ROW
EXECUTE FUNCTION actualizar_inventario_venta();

-- 3. Función para validación de stock antes de venta (opcional)
CREATE OR REPLACE FUNCTION validar_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
    stock_disponible INTEGER;
    producto_nombre TEXT;
BEGIN
    -- Solo validar si hay un producto_id
    IF NEW.producto_id IS NOT NULL THEN
        -- Obtener stock disponible
        SELECT 
            p.stock,
            p.nombre
        INTO 
            stock_disponible,
            producto_nombre
        FROM productos p
        WHERE p.id = NEW.producto_id;
        
        -- Validar que haya stock suficiente
        IF stock_disponible < NEW.cantidad THEN
            RAISE EXCEPTION '❌ Stock insuficiente para venta. Producto: % | Disponible: % | Solicitado: %',
                producto_nombre, stock_disponible, NEW.cantidad;
        END IF;
        
        -- Validar que el producto esté activo
        IF NOT EXISTS (
            SELECT 1 FROM productos 
            WHERE id = NEW.producto_id AND estado = 'activo'
        ) THEN
            RAISE EXCEPTION '❌ Producto no disponible para venta. ID: %', NEW.producto_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger BEFORE INSERT para validación
DROP TRIGGER IF EXISTS trigger_validar_stock_venta ON detalles_ventas;
CREATE TRIGGER trigger_validar_stock_venta
BEFORE INSERT ON detalles_ventas
FOR EACH ROW
EXECUTE FUNCTION validar_stock_venta();

-- 5. Tabla de auditoría de movimientos de inventario (si no existe)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('venta', 'compra', 'ajuste', 'devolucion')),
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    referencia_id UUID,
    referencia_tipo VARCHAR(20),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creado_por UUID REFERENCES perfiles(id),
    notas TEXT
);

-- 6. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto_id ON movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_creado_en ON movimientos_inventario(creado_en);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_tipo ON movimientos_inventario(tipo_movimiento);

-- 7. Vista de productos con bajo stock (para alertas)
CREATE OR REPLACE VIEW vista_productos_bajo_stock AS
SELECT 
    p.id,
    p.nombre,
    p.stock,
    p.stock_minimo,
    p.precio_venta,
    p.empresa_id,
    CASE 
        WHEN p.stock = 0 THEN 'AGOTADO'
        WHEN p.stock <= p.stock_minimo THEN 'CRÍTICO'
        WHEN p.stock <= (p.stock_minimo * 2) THEN 'BAJO'
        ELSE 'NORMAL'
    END as nivel_stock,
    p.updated_at
FROM productos p
WHERE p.estado = 'activo'
AND p.stock <= (p.stock_minimo * 2)
ORDER BY p.stock ASC;

-- 8. Función para reporte de inventario crítico
CREATE OR REPLACE FUNCTION obtener_inventario_critico(p_empresa_id UUID)
RETURNS TABLE(
    producto_id UUID,
    nombre TEXT,
    stock_actual INTEGER,
    stock_minimo INTEGER,
    nivel_stock TEXT,
    dias_restantes_estimados INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.stock,
        p.stock_minimo,
        CASE 
            WHEN p.stock = 0 THEN 'AGOTADO'
            WHEN p.stock <= p.stock_minimo THEN 'CRÍTICO'
            WHEN p.stock <= (p.stock_minimo * 2) THEN 'BAJO'
            ELSE 'NORMAL'
        END as nivel_stock,
        CASE 
            WHEN p.stock = 0 THEN 0
            ELSE GREATEST(1, p.stock / GREATEST(1, 
                (SELECT COALESCE(AVG(cantidad), 1) 
                 FROM movimientos_inventario mi 
                 WHERE mi.producto_id = p.id 
                 AND mi.tipo_movimiento = 'venta' 
                 AND mi.creado_en >= NOW() - INTERVAL '30 days')
            ))
        END as dias_restantes_estimados
    FROM productos p
    WHERE p.empresa_id = p_empresa_id
    AND p.estado = 'activo'
    AND p.stock <= (p.stock_minimo * 2)
    ORDER BY p.stock ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

/*
TRIGGER DE INVENTARIO AUTOMÁTICO - BEAUTYPRO

📋 DESCRIPCIÓN:
Este sistema de triggers automatiza completamente la gestión de inventario
en BeautyPro, asegurando que el stock siempre esté actualizado después
de cada venta.

🔧 FUNCIONALIDADES:

1. **trigger_actualizar_inventario_venta** (AFTER INSERT):
   - Resta automáticamente el stock vendido
   - Valida que no haya stock negativo
   - Genera alertas para stock bajo y agotado
   - Registra movimientos de auditoría
   - Actualiza timestamp de última modificación

2. **trigger_validar_stock_venta** (BEFORE INSERT):
   - Valida stock disponible ANTES de la venta
   - Verifica que el producto esté activo
   - Previente ventas de productos sin stock

3. **movimientos_inventario**:
   - Tabla de auditoría completa
   - Registra todos los movimientos de stock
   - Permite análisis y reportes

4. **vista_productos_bajo_stock**:
   - Vista actualizada de productos críticos
   - Clasificación por nivel de stock
   - Útil para dashboard y alertas

5. **obtener_inventario_critico()**:
   - Función para reportes avanzados
   - Calcula días restantes estimados
   - Ideal para gestión de compras

🚀 BENEFICIOS:

✅ Consistencia de datos garantizada
✅ Sin necesidad de lógica en la aplicación
✅ Auditoría completa de movimientos
✅ Alertas automáticas de stock crítico
✅ Mejor rendimiento (base de datos nativa)
✅ Prevención de ventas sin stock

⚠️ NOTAS IMPORTANTES:

- El trigger se ejecuta por cada fila de detalles_ventas
- Solo afecta productos (producto_id IS NOT NULL)
- Los servicios no afectan el inventario
- Se requiere que la tabla productos tenga el campo stock_minimo
- Las alertas se registran en los logs de PostgreSQL

🔍 MANTENIMIENTO:

- Monitorear logs para alertas de stock
- Revisar periódicamente movimientos_inventario
- Usar vista_productos_bajo_stock para dashboard
- Configurar notificaciones para niveles críticos

📊 REPORTES DISPONIBLES:

- Stock actual por producto
- Movimientos históricos
- Productos con bajo stock
- Tendencias de consumo
- Días restantes estimados

*/
