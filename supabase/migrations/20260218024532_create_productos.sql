-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iva DECIMAL(5,2) NOT NULL DEFAULT 0,
    sku VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'venta' CHECK (tipo IN ('venta', 'servicio')),
    stock INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    descripcion TEXT,
    costo_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    proveedor_id UUID REFERENCES proveedores(id),
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    es_para_venta BOOLEAN DEFAULT TRUE
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_empresa_id ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor_id ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION handle_productos_updated_at();
