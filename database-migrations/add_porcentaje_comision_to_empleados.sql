-- Migration: Add porcentaje_comision column to empleados table
-- This will allow automatic commission calculation per employee

-- Add the porcentaje_comision column to empleados table
ALTER TABLE empleados 
ADD COLUMN porcentaje_comision NUMERIC DEFAULT 50;

-- Add a check constraint to ensure the percentage is within reasonable bounds (0-100)
ALTER TABLE empleados 
ADD CONSTRAINT check_porcentaje_comision 
CHECK (porcentaje_comision >= 0 AND porcentaje_comision <= 100);

-- Update existing records to set default commission percentage
UPDATE empleados 
SET porcentaje_comision = 50 
WHERE porcentaje_comision IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN empleados.porcentaje_comision IS 'Commission percentage for employee (0-100), default 50%';
