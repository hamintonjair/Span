-- Crear tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL CHECK (rol IN ('admin_global', 'dueño', 'empleado')),
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_email ON usuarios_sistema(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_empresa_id ON usuarios_sistema(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_rol ON usuarios_sistema(rol);

-- Habilitar RLS (Row Level Security)
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Admin global puede ver todos los usuarios
CREATE POLICY "Admin global puede ver todos los usuarios" ON usuarios_sistema
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE id = auth.uid() AND rol = 'admin_global'
    )
  );

-- Dueño puede ver usuarios de su empresa
CREATE POLICY "Dueño puede ver usuarios de su empresa" ON usuarios_sistema
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE id = auth.uid() AND rol = 'dueño' 
      AND usuarios_sistema.empresa_id = usuarios_sistema.empresa_id
    )
  );

-- Dueño puede crear usuarios de su empresa
CREATE POLICY "Dueño puede crear usuarios de su empresa" ON usuarios_sistema
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE id = auth.uid() AND rol = 'dueño' 
      AND usuarios_sistema.empresa_id = usuarios_sistema.empresa_id
    )
  );

-- Dueño puede actualizar usuarios de su empresa
CREATE POLICY "Dueño puede actualizar usuarios de su empresa" ON usuarios_sistema
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE id = auth.uid() AND rol = 'dueño' 
      AND usuarios_sistema.empresa_id = usuarios_sistema.empresa_id
    )
  );

-- Dueño puede eliminar usuarios de su empresa
CREATE POLICY "Dueño puede eliminar usuarios de su empresa" ON usuarios_sistema
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE id = auth.uid() AND rol = 'dueño' 
      AND usuarios_sistema.empresa_id = usuarios_sistema.empresa_id
    )
  );

-- Solo admin global puede crear usuarios admin_global
CREATE POLICY "Solo admin global puede crear admin_global" ON usuarios_sistema
  FOR INSERT WITH CHECK (
    NOT (NEW.rol = 'admin_global') OR
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE id = auth.uid() AND rol = 'admin_global'
    )
  );

-- Solo admin global puede actualizar usuarios admin_global
CREATE POLICY "Solo admin global puede actualizar admin_global" ON usuarios_sistema
  FOR UPDATE USING (
    NOT (NEW.rol = 'admin_global') OR
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE id = auth.uid() AND rol = 'admin_global'
    )
  );

-- Solo admin global puede eliminar usuarios admin_global
CREATE POLICY "Solo admin global puede eliminar admin_global" ON usuarios_sistema
  FOR DELETE USING (
    NOT (OLD.rol = 'admin_global') OR
    EXISTS (
      SELECT 1 FROM usuarios_sistema 
      WHERE id = auth.uid() AND rol = 'admin_global'
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_sistema_updated_at 
  BEFORE UPDATE ON usuarios_sistema 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
