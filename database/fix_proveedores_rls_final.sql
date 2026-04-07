-- Solución RLS para proveedores compatible con JWT personalizado
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Empresas pueden ver sus propios proveedores" ON proveedores;
DROP POLICY IF EXISTS "Empresas pueden insertar sus propios proveedores" ON proveedores;
DROP POLICY IF EXISTS "Empresas pueden actualizar sus propios proveedores" ON proveedores;
DROP POLICY IF EXISTS "Empresas pueden eliminar sus propios proveedores" ON proveedores;

-- Opción 1: Deshabilitar RLS temporalmente (recomendado para JWT personalizado)
ALTER TABLE proveedores DISABLE ROW LEVEL SECURITY;

-- Opción 2: Si necesitas RLS, usa políticas simples que la aplicación maneje
-- Descomenta las siguientes líneas si prefieres mantener RLS activo

/*
-- Mantener RLS activo con políticas simples
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON proveedores
    FOR ALL USING (true) WITH CHECK (true);
*/
