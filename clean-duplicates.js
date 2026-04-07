// Script para limpiar duplicados de suscripciones
async function cleanDuplicates() {
  try {
    console.log('Iniciando limpieza de duplicados...');
    
    const response = await fetch('http://localhost:3000/api/clean-subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Limpieza completada:', data);
    } else {
      console.error('❌ Error en limpieza:', data);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

cleanDuplicates();
