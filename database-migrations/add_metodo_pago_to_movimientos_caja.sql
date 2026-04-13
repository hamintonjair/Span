-- Migration: Add metodo_pago column to movimientos_caja table
-- This will allow proper filtering of payment methods instead of relying on description text

-- Add the metodo_pago column to movimientos_caja table
ALTER TABLE movimientos_caja 
ADD COLUMN metodo_pago TEXT;

-- Add a check constraint to ensure only valid payment methods are used
ALTER TABLE movimientos_caja 
ADD CONSTRAINT check_metodo_pago 
CHECK (metodo_pago IN ('efectivo', 'transferencia') OR metodo_pago IS NULL);

-- Create an index for better performance on metodo_pago queries
CREATE INDEX idx_movimientos_caja_metodo_pago ON movimientos_caja(metodo_pago);

-- Update existing records to set default payment method based on description
-- This is a one-time migration for existing data
UPDATE movimientos_caja 
SET metodo_pago = 'efectivo' 
WHERE categoria = 'Abono Préstamo' 
AND descripcion ILIKE '%(efectivo)%';

UPDATE movimientos_caja 
SET metodo_pago = 'transferencia' 
WHERE categoria = 'Abono Préstamo' 
AND descripcion ILIKE '%(transferencia)%';

-- Add comment to document the column
COMMENT ON COLUMN movimientos_caja.metodo_pago IS 'Payment method: efectivo (cash) or transferencia (bank transfer)';
