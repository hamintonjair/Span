-- Corregir políticas RLS para contactos_pendientes usando auth.uid() verification
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Solo admin_global puede leer contactos pendientes" ON contactos_pendientes;
DROP POLICY IF EXISTS "Solo admin_global puede crear contactos pendientes" ON contactos_pendientes;
DROP POLICY IF EXISTS "Solo admin_global puede actualizar contactos pendientes" ON contactos_pendientes;
DROP POLICY IF EXISTS "Solo admin_global puede eliminar contactos pendientes" ON contactos_pendientes;
DROP POLICY IF EXISTS "Solo admin_global puede gestionar contactos pendientes" ON contactos_pendientes;

-- Crear políticas RLS correctas usando auth.uid() y usuarios_sistema
-- Política para SELECT
CREATE POLICY "admin_global_select_contactos_pendientes" ON contactos_pendientes
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM usuarios_sistema 
            WHERE rol = 'admin_global' AND activo = true
        )
    );

-- Política para INSERT
CREATE POLICY "admin_global_insert_contactos_pendientes" ON contactos_pendientes
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM usuarios_sistema 
            WHERE rol = 'admin_global' AND activo = true
        )
    );

-- Política para UPDATE
CREATE POLICY "admin_global_update_contactos_pendientes" ON contactos_pendientes
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM usuarios_sistema 
            WHERE rol = 'admin_global' AND activo = true
        )
    );

-- Política para DELETE
CREATE POLICY "admin_global_delete_contactos_pendientes" ON contactos_pendientes
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM usuarios_sistema 
            WHERE rol = 'admin_global' AND activo = true
        )
    );

-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contactos_pendientes'
ORDER BY policyname;

-- También verificar que RLS esté habilitado
ALTER TABLE contactos_pendientes ENABLE ROW LEVEL SECURITY;

-- Verificar estado de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerlspolicy
FROM pg_tables 
WHERE tablename = 'contactos_pendientes';
