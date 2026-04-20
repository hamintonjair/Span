-- Agregar campo nomina_id a la tabla comisiones para relacionar con la nómina
ALTER TABLE comisiones ADD COLUMN nomina_id UUID REFERENCES nominas(id) ON DELETE SET NULL;

-- Crear índice para mejor rendimiento en búsquedas por nomina_id
CREATE INDEX idx_comisiones_nomina_id ON comisiones(nomina_id);

-- Comentario para documentación
COMMENT ON COLUMN comisiones.nomina_id IS 'ID de la nómina a la que pertenece esta comisión (se asigna al pagar la nómina)';
