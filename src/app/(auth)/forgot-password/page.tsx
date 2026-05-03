'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { solicitarRecuperacion } from '@/app/actions/auth';
import { showToast } from '@/components/ui/toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [titular, setTitular] = useState('');

  
   useEffect(() => {
      const cargarTitular = async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('configuracion_global')
            .select('titular')
            .single() as any;
  
          if (error) {
            console.error('Error cargando titular:', error);
            return; // Mantener fallback 'Span'
          }
  
          if (data && data.titular) {
            setTitular(data.titular);
          }
        } catch (error) {
          console.error('Error cargando titular:', error);
          // Mantener fallback 'Span'
        }
      };
  
      cargarTitular();
    }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await solicitarRecuperacion(email);

      if (result.success) {
        setSubmitted(true);
        showToast('Se ha enviado un enlace de recuperación a tu correo', 'success');
      } else {
        setError(result.error || 'Error al solicitar recuperación');
      }
    } catch (err) {
      console.error('Error en recuperación:', err);
      setError('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">{titular.substring(0, 2).toUpperCase()}</span>
            </div>
            <h1 className="text-2xl font-bold text-amber-500 mb-2">Recuperar Contraseña</h1>
            <p className="text-amber-500">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </CardHeader>

          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={loading}
                />

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </div>
                  ) : (
                    'Enviar Enlace de Recuperación'
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">¡Revisa tu correo!</h3>
                  <p className="text-gray-600 text-sm">
                    Hemos enviado un enlace de recuperación a <strong>{email}</strong>
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    El enlace expirará en 1 hora por seguridad
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-amber-600 hover:text-amber-700 text-sm font-medium inline-flex items-center"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Volver al Inicio de Sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
