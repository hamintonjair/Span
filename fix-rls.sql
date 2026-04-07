-- Eliminar políticas existentes de usuarios_sistema
DROP POLICY IF EXISTS "Users can view own profile" ON usuarios_sistema;
DROP POLICY IF EXISTS "Users can insert own profile" ON usuarios_sistema;
DROP POLICY IF EXISTS "Users can update own profile" ON usuarios_sistema;
DROP POLICY IF EXISTS "Users can delete own profile" ON usuarios_sistema;

-- Crear política temporal que permite todo a usuarios autenticados
CREATE POLICY "Permitir todo a autenticados" ON usuarios_sistema 
FOR ALL TO authenticated 
USING (true);

-- Habilitar RLS en la tabla
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
