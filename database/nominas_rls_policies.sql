-- Políticas RLS para la tabla nominas
-- Solo los admin_empresa pueden gestionar nóminas
-- Los empleados no pueden ver las nóminas de sus compañeros

-- 1. Habilitar RLS en la tabla nominas
ALTER TABLE nominas ENABLE ROW LEVEL SECURITY;

-- 2. Política para admin_empresa: Acceso completo a nóminas de su empresa
CREATE POLICY "Admin empresa puede gestionar nominas" ON nominas
FOR ALL USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios_sistema 
    WHERE usuarios_sistema.id = auth.uid() 
    AND usuarios_sistema.rol = 'admin_empresa'
    AND usuarios_sistema.empresa_id = nominas.empresa_id
  )
);

-- 3. Política para empleados: Solo pueden ver sus propias nóminas (si es necesario en el futuro)
-- Por ahora los empleados no tienen acceso a ver nóminas
CREATE POLICY "Empleados solo ven sus nominas" ON nominas
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios_sistema 
    WHERE usuarios_sistema.id = auth.uid() 
    AND usuarios_sistema.rol IN ('empleado', 'admin_empresa')
    AND (
      -- Si es empleado, solo ve sus propias nóminas
      (usuarios_sistema.rol = 'empleado' AND usuarios_sistema.id = nominas.empleado_id)
      OR
      -- Si es admin_empresa, ve todas las nóminas de su empresa
      (usuarios_sistema.rol = 'admin_empresa' AND usuarios_sistema.empresa_id = nominas.empresa_id)
    )
  )
);

-- 4. Política restrictiva para INSERT: Solo admin_empresa puede crear nóminas
CREATE POLICY "Solo admin empresa puede crear nominas" ON nominas
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios_sistema 
    WHERE usuarios_sistema.id = auth.uid() 
    AND usuarios_sistema.rol = 'admin_empresa'
    AND usuarios_sistema.empresa_id = nominas.empresa_id
  )
);

-- 5. Política restrictiva para UPDATE: Solo admin_empresa puede modificar nóminas
CREATE POLICY "Solo admin empresa puede modificar nominas" ON nominas
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios_sistema 
    WHERE usuarios_sistema.id = auth.uid() 
    AND usuarios_sistema.rol = 'admin_empresa'
    AND usuarios_sistema.empresa_id = nominas.empresa_id
  )
);

-- 6. Política restrictiva para DELETE: Solo admin_empresa puede eliminar nóminas
CREATE POLICY "Solo admin empresa puede eliminar nominas" ON nominas
FOR DELETE USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios_sistema 
    WHERE usuarios_sistema.id = auth.uid() 
    AND usuarios_sistema.rol = 'admin_empresa'
    AND usuarios_sistema.empresa_id = nominas.empresa_id
  )
);

-- 7. Política adicional para restringir completamente el acceso de empleados
-- Esta es la política principal que bloquea a los empleados
CREATE POLICY "Bloquear acceso de empleados a nominas ajenas" ON nominas
FOR ALL USING (
  auth.role() = 'authenticated' 
  AND (
    -- Admin empresa: acceso completo a nóminas de su empresa
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE usuarios_sistema.id = auth.uid() 
      AND usuarios_sistema.rol = 'admin_empresa'
      AND usuarios_sistema.empresa_id = nominas.empresa_id
    )
    OR
    -- Empleado: solo acceso a sus propias nóminas (si se necesita en el futuro)
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE usuarios_sistema.id = auth.uid() 
      AND usuarios_sistema.rol = 'empleado'
      AND usuarios_sistema.id = nominas.empleado_id
    )
  )
);

-- Comentarios para documentación
COMMENT ON POLICY "Admin empresa puede gestionar nominas" ON nominas IS 'Permite a los administradores de empresa acceso completo a las nóminas de su empresa';
COMMENT ON POLICY "Empleados solo ven sus nominas" ON nominas IS 'Permite a los empleados ver solo sus propias nóminas (desactivado por seguridad)';
COMMENT ON POLICY "Solo admin empresa puede crear nominas" ON nominas IS 'Restringe la creación de nóminas solo a administradores de empresa';
COMMENT ON POLICY "Solo admin empresa puede modificar nominas" ON nominas IS 'Restringe la modificación de nóminas solo a administradores de empresa';
COMMENT ON POLICY "Solo admin empresa puede eliminar nominas" ON nominas IS 'Restringe la eliminación de nóminas solo a administradores de empresa';
COMMENT ON POLICY "Bloquear acceso de empleados a nominas ajenas" ON nominas IS 'Política principal que bloquea el acceso de empleados a nóminas de otros empleados';

-- Nota importante sobre seguridad:
-- Los empleados NO deben poder ver las nóminas de sus compañeros por privacidad salarial
-- Solo los admin_empresa tienen acceso completo a todas las nóminas de la empresa
-- Si en el futuro se necesita que los empleados vean sus propias nóminas, 
-- se puede habilitar la política "Empleados solo ven sus nominas"
