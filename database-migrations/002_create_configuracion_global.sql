-- Crear tabla configuracion_global
-- Almacena la configuración global del sistema para administradores

CREATE TABLE IF NOT EXISTS configuracion_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banco VARCHAR(255) NOT NULL DEFAULT 'Banco Nacional',
    tipo_cuenta VARCHAR(100) NOT NULL DEFAULT 'Cuenta Corriente',
    numero_cuenta VARCHAR(50) NOT NULL DEFAULT '1234-5678-9012',
    titular VARCHAR(255) NOT NULL DEFAULT 'Mi Empresa S.A.',
    documento_titular VARCHAR(50),
    porcentaje_iva DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    whatsapp_soporte VARCHAR(50) NOT NULL DEFAULT '+593 987 654 321',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice único para asegurar solo un registro
CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracion_global_single 
ON configuracion_global ((1));

-- Insertar configuración inicial si la tabla está vacía
INSERT INTO configuracion_global (
    banco,
    tipo_cuenta,
    numero_cuenta,
    titular,
    documento_titular,
    porcentaje_iva,
    whatsapp_soporte
) VALUES (
    'Banco Nacional',
    'Cuenta Corriente',
    '1234-5678-9012',
    'Mi Empresa S.A.',
    '1712345678',
    12.00,
    '+593 987 654 321'
) ON CONFLICT DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE configuracion_global IS 'Tabla de configuración global del sistema - solo debe tener un registro';
COMMENT ON COLUMN configuracion_global.banco IS 'Nombre del banco para pagos';
COMMENT ON COLUMN configuracion_global.tipo_cuenta IS 'Tipo de cuenta bancaria';
COMMENT ON COLUMN configuracion_global.numero_cuenta IS 'Número de cuenta bancaria';
COMMENT ON COLUMN configuracion_global.titular IS 'Nombre del titular de la cuenta';
COMMENT ON COLUMN configuracion_global.documento_titular IS 'Documento de identificación del titular';
COMMENT ON COLUMN configuracion_global.porcentaje_iva IS 'Porcentaje de IVA aplicable';
COMMENT ON COLUMN configuracion_global.whatsapp_soporte IS 'Número de WhatsApp para soporte técnico';
COMMENT ON COLUMN configuracion_global.creado_en IS 'Fecha de creación del registro';
COMMENT ON COLUMN configuracion_global.actualizado_en IS 'Fecha de última actualización';
