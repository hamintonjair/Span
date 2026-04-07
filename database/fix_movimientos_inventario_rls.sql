-- Fix RLS para movimientos_inventario
-- Deshabilitar RLS temporalmente o crear políticas permisivas

-- Opción 1: Deshabilitar RLS completamente
ALTER TABLE movimientos_inventario DISABLE ROW LEVEL SECURITY;

-- Opción 2: Crear políticas permisivas (recomendado si necesitas RLS)
DROP POLICY IF EXISTS "Users can view own company movements" ON movimientos_inventario;
DROP POLICY IF EXISTS "Users can insert own company movements" ON movimientos_inventario;
DROP POLICY IF EXISTS "Users can update own company movements" ON movimientos_inventario;
DROP POLICY IF EXISTS "Users can delete own company movements" ON movimientos_inventario;

-- Política para SELECT (lectura)
CREATE POLICY "Users can view own company movements" ON movimientos_inventario
  FOR SELECT USING (empresa_id = auth.uid());

-- Política para INSERT (creación)
CREATE POLICY "Users can insert own company movements" ON movimientos_inventario
  FOR INSERT WITH CHECK (empresa_id = auth.uid());

-- Política para UPDATE (actualización)
CREATE POLICY "Users can update own company movements" ON movimientos_inventario
  FOR UPDATE USING (empresa_id = auth.uid());

-- Política para DELETE (eliminación)
CREATE POLICY "Users can delete own company movements" ON movimientos_inventario
  FOR DELETE USING (empresa_id = auth.uid());

-- Nota: Si usas JWT personalizado, es posible que necesites ajustar las políticas
-- para que coincidan con tu sistema de autenticación específico
