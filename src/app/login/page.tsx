'use client';

import { useState, useEffect } from 'react';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestPasswordReset } from '@/services/email.service';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useJWTAuth();
  const redirect = searchParams.get('redirect') || '/dashboard';

  // Mostrar mensaje de suspensión si viene del middleware
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error === 'EMPRESA_SUSPENDIDA' && message) {
      setError(message);
    } else if (error === 'SUSCRIPCION_VENCIDA' && message) {
      setError(message);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Iniciando autenticación JWT con:', formData.email);
      
      const result = await login(formData.email, formData.password);
      
      console.log('Respuesta de login JWT:', result);
      
      if (result.success) {
        console.log('Login exitoso, verificando estado de empresa...');
        
        // Para usuarios no admin_global, verificar estado de empresa antes de redirigir
        if (result.user && result.user.rol !== 'admin_global' && result.user.empresa_id) {
          try {
            const response = await fetch(`/api/empresas/${result.user.empresa_id}`);
            if (response.ok) {
              const empresaData = await response.json();
              const empresa = empresaData.empresa;
              
              // Si la empresa está suspendida o vencida, redirigir directamente a suscripción
              if (empresa.estado === 'suspendido' || 
                  (empresa.fecha_vencimiento && new Date(empresa.fecha_vencimiento) < new Date())) {
                console.log('Empresa suspendida/vencida, redirigiendo a suscripción...');
                window.location.href = '/suscripcion';
                return;
              }
            }
          } catch (error) {
            console.error('Error verificando estado de empresa:', error);
          }
        }
        
        console.log('Redirigiendo a dashboard...');
        window.location.href = '/dashboard';
      } else {
        console.error('Error de autenticación:', result.error);
        setError('Credenciales inválidas: ' + result.error);
      }
      
    } catch (error) {
      console.error('Error general en login:', error);
      setError('Error en el login: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await requestPasswordReset(formData.email);
      
      if (result.success) {
        alert('Se ha enviado un enlace de restablecimiento a tu correo');
        setShowForgotPassword(false);
      } else {
        setError(result.error || 'Error al enviar correo de recuperación');
      }
    } catch (error) {
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
              <span className="text-white font-bold text-2xl">BP</span>
            </div>
            <h1 className="text-2xl font-bold text-amber-500 mb-2">
              {showForgotPassword ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
            </h1>
            <p className="text-amber-500">
              {showForgotPassword 
                ? 'Te enviaremos un enlace para restablecer tu contraseña'
                : 'Bienvenido de nuevo a BeautyPro'
              }
            </p>
          </CardHeader>
          
          <CardContent>
            {!showForgotPassword ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                  required
                />
                
                <Input
                  label="Contraseña"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="•••••••••"
                  required
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                  required
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(!showForgotPassword);
                  setError('');
                }}
                className="text-amber-600 hover:text-amber-700 text-sm"
              >
                {showForgotPassword 
                  ? 'Volver al inicio de sesión'
                  : '¿Olvidaste tu contraseña?'
                }
              </button>
            </div>

            {!showForgotPassword && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes una cuenta? 
                  <a href="/register" className="text-amber-600 hover:text-amber-700 ml-1">
                    Regístrate
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
