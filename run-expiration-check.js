// Script para ejecutar verificación de vencimientos
async function runExpirationCheck() {
  try {
    console.log('🕐 Iniciando verificación de vencimientos...');
    
    const response = await fetch('http://localhost:3000/api/cron/check-expirations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Verificación completada:', data);
      
      // Ejecutar limpieza de duplicados después de la verificación
      console.log('🧹 Iniciando limpieza de duplicados...');
      const cleanResponse = await fetch('http://localhost:3000/api/cron/clean-duplicate-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const cleanData = await cleanResponse.json();
      
      if (cleanResponse.ok) {
        console.log('✅ Limpieza completada:', cleanData);
      } else {
        console.error('❌ Error en limpieza:', cleanData);
      }
    } else {
      console.error('❌ Error en verificación:', data);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

runExpirationCheck();
