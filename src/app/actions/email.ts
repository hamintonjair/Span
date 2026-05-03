'use server';

import { enviarCorreoBienvenida } from '@/services/email.service';

export async function sendEmailReceipt(email: string, receiptData: any) {
  try {
    // Simulación de envío de email
    
    // En producción, aquí iría la lógica real de envío de email
    // usando el servicio email.service.ts o un proveedor como SendGrid, Resend, etc.
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
    
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Error al enviar el recibo' };
  }
}

/**
 * Server Action para enviar correo de bienvenida con credenciales usando Resend
 */
export async function enviarCorreoBienvenidaAction(
  email: string,
  nombre: string,
  passwordPlano: string,
  nombreEmpresa: string
) {
  try {
    const result = await enviarCorreoBienvenida(email, nombre, passwordPlano, nombreEmpresa);
    return result;
  } catch (error) {
    console.error('Error en Server Action enviarCorreoBienvenidaAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar correo de bienvenida'
    };
  }
}
