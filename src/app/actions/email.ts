'use server';

export async function sendEmailReceipt(email: string, receiptData: any) {
  try {
    // Simulación de envío de email
    console.log('Enviando recibo a:', email);
    console.log('Datos del recibo:', receiptData);
    
    // En producción, aquí iría la lógica real de envío de email
    // usando el servicio email.service.ts o un proveedor como SendGrid, Resend, etc.
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
    
    return { success: true, message: 'Recibo enviado exitosamente' };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, message: 'Error al enviar el recibo' };
  }
}
