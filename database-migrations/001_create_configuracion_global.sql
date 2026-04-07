-- Crear tabla configuracion_global
CREATE TABLE IF NOT EXISTS configuracion_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_nombre VARCHAR NOT NULL,
  banco_numero VARCHAR NOT NULL,
  banco_titular VARCHAR NOT NULL,
  banco_tipo VARCHAR,
  whatsapp_soporte VARCHAR,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar que solo haya una fila (crear configuración inicial si no existe)
INSERT INTO configuracion_global (banco_nombre, banco_numero, banco_titular, banco_tipo, whatsapp_soporte)
SELECT 
  'Banco Nacional' as banco_nombre,
  '1234-5678-9012' as banco_numero,
  'Mi Empresa S.A.' as banco_titular,
  'Cuenta Corriente' as banco_tipo,
  '+593 987 654 321' as whatsapp_soporte
WHERE NOT EXISTS (
  SELECT 1 FROM configuracion_global LIMIT 1
);

-- Crear índice único para asegurar una sola fila (opcional, pero bueno para seguridad)
CREATE UNIQUE INDEX IF NOT EXISTS single_config_row 
ON configuracion_global ((id IS NOT NULL));

-- Política RLS (Row Level Security) - solo admin_global puede modificar
ALTER TABLE configuracion_global ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer (para el modal de pago)
CREATE POLICY "Todos pueden leer configuracion_global" 
ON configuracion_global FOR SELECT 
USING (true);

-- Política para que solo admin_global pueda modificar
CREATE POLICY "Solo admin_global puede modificar configuracion_global" 
ON configuracion_global FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    JOIN usuarios ON usuarios.auth_id = auth.users.id 
    WHERE auth.users.id = auth.uid() 
    AND usuarios.rol = 'admin_global'
  )
);
