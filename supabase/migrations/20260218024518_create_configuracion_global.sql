-- Crear tabla de configuración global
CREATE TABLE IF NOT EXISTS configuracion_global (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banco VARCHAR(255) NOT NULL DEFAULT 'Banco Nacional',
    tipo_cuenta VARCHAR(100) NOT NULL DEFAULT 'Cuenta Corriente',
    numero_cuenta VARCHAR(50) NOT NULL DEFAULT '1234-5678-9012',
    titular VARCHAR(255) NOT NULL DEFAULT 'Mi Empresa S.A.',
    documento_titular VARCHAR(50),
    porcentaje_iva DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    whatsapp_soporte VARCHAR(50) NOT NULL DEFAULT '+593 987 654 321',
    direccion VARCHAR(255) DEFAULT NULL,
    ciudad VARCHAR(100) DEFAULT NULL,
    logo_url TEXT DEFAULT NULL,
    mensaje_global TEXT DEFAULT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION handle_configuracion_global_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER configuracion_global_updated_at
    BEFORE UPDATE ON configuracion_global
    FOR EACH ROW
    EXECUTE FUNCTION handle_configuracion_global_updated_at();
