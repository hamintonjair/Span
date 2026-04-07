// Helper para calcular comisiones

/**
 * Calcula el monto de comisión basado en el precio y porcentaje
 * @param precioServicio - Precio del servicio
 * @param porcentajeComision - Porcentaje de comisión (ej: 10 para 10%)
 * @returns Monto de la comisión en dinero
 */
export const calcularMontoComision = (
  precioServicio: number,
  porcentajeComision: number
): number => {
  if (precioServicio <= 0 || porcentajeComision <= 0) {
    return 0;
  }
  
  return (precioServicio * porcentajeComision) / 100;
};

/**
 * Formatea el monto de comisión para mostrar en UI
 * @param monto - Monto de la comisión
 * @returns String formateado con símbolo de moneda
 */
export const formatearMontoComision = (monto: number): string => {
  return `$${monto.toFixed(2)}`;
};

/**
 * Calcula y formatea la comisión en un solo paso
 * @param precioServicio - Precio del servicio
 * @param porcentajeComision - Porcentaje de comisión
 * @returns String formateado con símbolo de moneda
 */
export const calcularYFormatearComision = (
  precioServicio: number,
  porcentajeComision: number
): string => {
  const monto = calcularMontoComision(precioServicio, porcentajeComision);
  return formatearMontoComision(monto);
};

/**
 * Valida que el porcentaje de comisión esté en un rango válido
 * @param porcentaje - Porcentaje a validar
 * @returns boolean indicando si es válido
 */
export const validarPorcentajeComision = (porcentaje: number): boolean => {
  return porcentaje >= 0 && porcentaje <= 100;
};
