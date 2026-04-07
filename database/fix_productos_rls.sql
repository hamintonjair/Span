-- Opción 1: Deshabilitar RLS completamente (RECOMENDADO para JWT personalizado)
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- Opción 2: Si prefieres mantener RLS, crear políticas muy permisivas
-- Deshabilitar políticas existentes
DROP POLICY IF EXISTS "Enable all operations for productos" ON productos;

-- Crear políticas muy permisivas que no dependen de auth.uid()
CREATE POLICY "Enable all operations for productos" ON productos
    FOR ALL USING (true) WITH CHECK (true);

-- Nota: La seguridad real la maneja la aplicación a través del filtro empresa_id
