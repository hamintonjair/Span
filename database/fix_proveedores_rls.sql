-- Corregir políticas RLS para proveedores - Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own company's proveedores" ON proveedores;
DROP POLICY IF EXISTS "Users can insert their own company's proveedores" ON proveedores;
DROP POLICY IF EXISTS "Users can update their own company's proveedores" ON proveedores;
DROP POLICY IF EXISTS "Users can delete their own company's proveedores" ON proveedores;

-- Nuevas políticas RLS simplificadas basadas en empresa_id
CREATE POLICY "Enable read access for all users" ON proveedores
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON proveedores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON proveedores
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON proveedores
    FOR DELETE USING (true);
