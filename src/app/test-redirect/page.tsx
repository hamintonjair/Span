'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('Probando redirección manual...');
    
    // Redirigir manualmente al dashboard
    setTimeout(() => {
      console.log('Ejecutando redirección...');
      window.location.href = '/dashboard';
    }, 2000);
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
          🧭 Probando Redirección
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Redirigiendo al dashboard en 2 segundos...
        </p>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Revisa la consola para ver los logs.
        </p>
      </div>
    </div>
  );
}
