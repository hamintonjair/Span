// Script para probar el flujo completo de pagos
async function testPaymentFlow() {
  console.log('🧪 Iniciando prueba del flujo de pagos...');
  
  try {
    // 1. Probar verificación de vencimientos
    console.log('\n1️⃣  Probando verificación de vencimientos...');
    const expirationResponse = await fetch('http://localhost:3000/api/cron/check-expirations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const expirationData = await expirationResponse.json();
    console.log('Respuesta verificación:', expirationData);
    
    // 2. Probar limpieza de duplicados
    console.log('\n2️⃣  Probando limpieza de duplicados...');
    const cleanResponse = await fetch('http://localhost:3000/api/cron/clean-duplicate-subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const cleanData = await cleanResponse.json();
    console.log('Respuesta limpieza:', cleanData);
    
    // 3. Verificar estado actual de empresas
    console.log('\n3️⃣  Verificando estado actual de empresas...');
    const empresasResponse = await fetch('http://localhost:3000/api/empresas');
    const empresasData = await empresasResponse.json();
    
    if (empresasData.success) {
      empresasData.empresas.forEach(empresa => {
        console.log(`Empresa: ${empresa.nombre}`);
        console.log(`  - Estado: ${empresa.estado}`);
        console.log(`  - Vencimiento: ${empresa.fecha_vencimiento || 'N/A'}`);
        console.log(`  - Suscripciones: ${empresa.suscripciones?.length || 0}`);
        
        if (empresa.suscripciones && empresa.suscripciones.length > 0) {
          empresa.suscripciones.forEach(sus => {
            console.log(`    * Suscripción: ${sus.estado_pago} - Monto: ${sus.monto || 0}`);
          });
        }
      });
    }
    
    console.log('\n✅ Prueba del flujo completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en prueba del flujo:', error.message);
  }
}

testPaymentFlow();
