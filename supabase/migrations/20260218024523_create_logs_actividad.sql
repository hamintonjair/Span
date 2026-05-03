-- Crear tabla de logs de actividad
CREATE TABLE IF NOT EXISTS logs_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
  empresa_id UUID REFERENCES empresas(id),
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  descripcion TEXT,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address INET,
  user_agent TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON logs_actividad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_empresa_id ON logs_actividad(empresa_id);
CREATE INDEX IF NOT EXISTS idx_logs_creado_en ON logs_actividad(creado_en);
CREATE INDEX IF NOT EXISTS idx_logs_modulo ON logs_actividad(modulo);
