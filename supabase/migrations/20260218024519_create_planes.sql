-- Crear tabla de planes
CREATE TABLE IF NOT EXISTS planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_usuarios INTEGER NOT NULL DEFAULT 5,
  max_empleados INTEGER NOT NULL DEFAULT 5,
  descripcion TEXT,
  tiene_inventario BOOLEAN DEFAULT FALSE,
  tiene_comisiones BOOLEAN DEFAULT FALSE,
  tiene_marketing BOOLEAN DEFAULT FALSE,
  tiene_analytics BOOLEAN DEFAULT FALSE,
  tiene_nominas BOOLEAN DEFAULT FALSE,
  soporte_prioritario BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Crear trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION handle_planes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER planes_updated_at
    BEFORE UPDATE ON planes
    FOR EACH ROW
    EXECUTE FUNCTION handle_planes_updated_at();

-- Insertar planes por defecto
INSERT INTO planes (nombre, precio, max_usuarios, max_empleados, descripcion, tiene_inventario, tiene_comisiones, tiene_marketing, tiene_analytics, tiene_nominas, soporte_prioritario) VALUES
('Básico', 29.99, 5, 5, 'Plan perfecto para pequeños salones', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
('Profesional', 79.99, 20, 20, 'Ideal para salones en crecimiento', TRUE, TRUE, FALSE, FALSE, FALSE, FALSE),
('Empresarial', 150999.00, 50, 50, 'Gestión de citas, Inventario, Nóminas, Analytics, Marketing, Comisiones y Soporte Prioritario', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (nombre) DO NOTHING;
