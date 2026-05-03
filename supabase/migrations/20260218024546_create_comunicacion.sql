-- Crear tabla de comunicación global (singleton)
CREATE TABLE IF NOT EXISTS comunicacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banco VARCHAR(100) NOT NULL DEFAULT 'Bancolombia',
    tipo_cuenta VARCHAR(50) NOT NULL DEFAULT 'Cuenta de Ahorro',
    numero_cuenta VARCHAR(50) NOT NULL,
    titular VARCHAR(255) NOT NULL,
    documento_titular VARCHAR(50) NOT NULL,
    porcentaje_iva DECIMAL(5,2) NOT NULL DEFAULT 19,
    whatsapp_soporte VARCHAR(50) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mensaje_global TEXT,
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    logo_url TEXT
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_comunicacion_creado_en ON comunicacion(creado_en);
CREATE INDEX IF NOT EXISTS idx_comunicacion_actualizado_en ON comunicacion(actualizado_en);

-- Crear trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION handle_comunicacion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comunicacion_updated_at
    BEFORE UPDATE ON comunicacion
    FOR EACH ROW
    EXECUTE FUNCTION handle_comunicacion_updated_at();
