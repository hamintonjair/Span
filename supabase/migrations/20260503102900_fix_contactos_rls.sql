-- Actualizar políticas RLS para contactos_pendientes
-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Solo admin_global puede gestionar contactos pendientes" ON contactos_pendientes;

-- Crear políticas RLS correctas para contactos_pendientes
-- Política para SELECT (lectura)
CREATE POLICY "Solo admin_global puede leer contactos pendientes" ON contactos_pendientes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            JOIN usuarios_sistema ON auth.users.id = usuarios_sistema.id 
            WHERE usuarios_sistema.rol = 'admin_global'
            AND auth.users.id = auth.uid()
        )
    );

-- Política para INSERT (creación)
CREATE POLICY "Solo admin_global puede crear contactos pendientes" ON contactos_pendientes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            JOIN usuarios_sistema ON auth.users.id = usuarios_sistema.id 
            WHERE usuarios_sistema.rol = 'admin_global'
            AND auth.users.id = auth.uid()
        )
    );

-- Política para UPDATE (actualización)
CREATE POLICY "Solo admin_global puede actualizar contactos pendientes" ON contactos_pendientes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            JOIN usuarios_sistema ON auth.users.id = usuarios_sistema.id 
            WHERE usuarios_sistema.rol = 'admin_global'
            AND auth.users.id = auth.uid()
        )
    );

-- Política para DELETE (eliminación)
CREATE POLICY "Solo admin_global puede eliminar contactos pendientes" ON contactos_pendientes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            JOIN usuarios_sistema ON auth.users.id = usuarios_sistema.id 
            WHERE usuarios_sistema.rol = 'admin_global'
            AND auth.users.id = auth.uid()
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
WHERE tablename = 'contactos_pendientes';
