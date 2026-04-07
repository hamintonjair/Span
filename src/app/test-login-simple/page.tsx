'use client';

import { useEffect } from 'react';

export default function TestLoginSimplePage() {
  useEffect(() => {
    // Simular login exitoso y redirigir
    console.log('Simulando login exitoso...');
    
    setTimeout(() => {
      console.log('Redirigiendo al dashboard...');
      window.location.href = '/dashboard';
    }, 1000);
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
          🔐 Test Login Simple
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Simulando login y redirigiendo...
        </p>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Revisa la consola y espera la redirección.
        </p>
      </div>
    </div>
  );
}
