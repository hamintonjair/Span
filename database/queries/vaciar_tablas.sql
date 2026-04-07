-- ============================================
-- VACIAR TODAS LAS TABLAS PARA EMPEZAR DE CERO
-- ============================================

-- ADVERTENCIA: ESTO BORRARÁ TODOS LOS DATOS
-- Ejecutar solo si quieres empezar completamente desde cero

-- ============================================
-- 1. Vaciar tabla perfiles (nuestra tabla)
-- ============================================
DELETE FROM perfiles;

-- ============================================
-- 2. Vaciar tabla empresas (nuestra tabla)
-- ============================================
DELETE FROM empresas;

-- ============================================
-- 3. Vaciar tabla detalles_ventas (nuestra tabla)
-- ============================================
DELETE FROM detalles_ventas;

-- ============================================
-- 4. Vaciar tabla ventas (nuestra tabla)
-- ============================================
DELETE FROM ventas;

-- ============================================
-- 5. Vaciar tabla productos (nuestra tabla)
-- ============================================
DELETE FROM productos;

-- ============================================
-- 6. Vaciar tabla servicios (nuestra tabla)
-- ============================================
DELETE FROM servicios;

-- ============================================
-- 7. Vaciar tabla citas (nuestra tabla)
-- ============================================
DELETE FROM citas;

-- ============================================
-- 8. Vaciar tabla empleados (nuestra tabla)
-- ============================================
DELETE FROM empleados;

-- ============================================
-- 9. Vaciar tabla prestamos (nuestra tabla)
-- ============================================
DELETE FROM prestamos;

-- ============================================
-- 10. Vaciar tabla cajas (nuestra tabla)
-- ============================================
DELETE FROM cajas;

-- ============================================
-- 11. Vaciar tabla movimientos_inventario (nuestra tabla)
-- ============================================
DELETE FROM movimientos_inventario;

-- ============================================
-- 12. NO VACIAR auth.users (tabla de Supabase)
-- ============================================
-- Para borrar usuarios de auth.users, hacerlo desde el panel:
-- Authentication → Users → Seleccionar → Delete

-- ============================================
-- Verificar que las tablas estén vacías
-- ============================================

SELECT 'perfiles' as tabla, COUNT(*) as registros FROM perfiles
UNION ALL
SELECT 'empresas' as tabla, COUNT(*) as registros FROM empresas
UNION ALL
SELECT 'ventas' as tabla, COUNT(*) as registros FROM ventas
UNION ALL
SELECT 'productos' as tabla, COUNT(*) as registros FROM productos
UNION ALL
SELECT 'servicios' as tabla, COUNT(*) as registros FROM servicios
UNION ALL
SELECT 'citas' as tabla, COUNT(*) as registros FROM citas
UNION ALL
SELECT 'empleados' as tabla, COUNT(*) as registros FROM empleados
UNION ALL
SELECT 'prestamos' as tabla, COUNT(*) as registros FROM prestamos
UNION ALL
SELECT 'cajas' as tabla, COUNT(*) as registros FROM cajas;
