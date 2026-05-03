'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { UserIcon, BuildingOfficeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/components/ui/toast';
import bcrypt from 'bcryptjs';
import { enviarCorreoBienvenidaAction } from '@/app/actions/email';
import { registrarLogAdmin } from '@/lib/auditAdmin';

// Componente Progress simple ya que no existe
const Progress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-amber-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

interface DatosDueño {
  nombre: string;
  email: string;
  password: string;
}

interface DatosSalon {
  nombre: string;
  telefono: string;
  ciudad: string;
}

export default function RegistroPage() {
  const router = useRouter();
  const [pasoActual, setPasoActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [titular, setTitular] = useState('Span'); // Fallback por defecto
  
  // Estados para cada paso
  const [datosDueño, setDatosDueño] = useState<DatosDueño>({
    nombre: '',
    email: '',
    password: ''
  });
  
  const [datosSalon, setDatosSalon] = useState<DatosSalon>({
    nombre: '',
    telefono: '',
    ciudad: ''
  });

  const progreso = (pasoActual / 3) * 100;

  // Cargar titular de configuracion_global al montar el componente
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

  // Validar email único
  const validarEmailUnico = async (email: string): Promise<boolean> => {
    try {
      // Usar cliente con service role key para bypass RLS en registro público
      const supabase = createClient();
      
      // Sobrescribir para usar service role temporalmente
      (supabase as any).supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      (supabase as any).supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('email')
        .eq('email', email)
        .maybeSingle(); // Usar maybeSingle en lugar de single
      
      // Si no hay error y no hay datos, el email no existe
      if (!error && !data) {
        return true; // Email disponible
      }
      
      // Si hay error de "no rows found", el email está disponible
      if (error && error.code === 'PGRST116') {
        return true; // Email disponible
      }
      
      // Cualquier otro caso, email no disponible
      return false;
    } catch (error) {
      console.error('Error validando email único:', error);
      // En caso de error, asumimos que el email no está disponible por seguridad
      return false;
    }
  };

  // Validar Paso 1
  const validarPaso1 = async (): Promise<boolean> => {
    if (!datosDueño.nombre.trim()) {
      setError('El nombre completo es requerido');
      return false;
    }
    
    if (!datosDueño.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    
    // Validación más estricta de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(datosDueño.email)) {
      setError('El email no es válido. Usa un formato como: usuario@dominio.com');
      return false;
    }
    
    // Validaciones adicionales para emails problemáticos
    const email = datosDueño.email.toLowerCase().trim();
    
    // No bloquear dominios comunes - permitir gmail, hotmail, etc.
    const domain = email.split('@')[1];
    
    // Sugerir dominios alternativos
    const allowedDomains = ['empresa.com', 'negocio.co', 'salon.style', 'beautypro.app'];
    
    if (datosDueño.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const emailUnico = await validarEmailUnico(email);
      if (!emailUnico) {
        setError('Este email ya está registrado');
        setLoading(false);
        return false;
      }
    } catch (validationError) {
      console.error('Error en validación de email:', validationError);
      setError('Error al validar el email. Intenta con otro.');
      setLoading(false);
      return false;
    }
    
    setLoading(false);
    return true;
  };

  // Validar Paso 2
  const validarPaso2 = (): boolean => {
    if (!datosSalon.nombre.trim()) {
      setError('El nombre del salón es requerido');
      return false;
    }
    
    if (!datosSalon.telefono.trim()) {
      setError('El teléfono es requerido');
      return false;
    }
    
    const telefonoRegex = /^[0-9]{10}$/;
    if (!telefonoRegex.test(datosSalon.telefono.replace(/\D/g, ''))) {
      setError('El teléfono debe tener 10 dígitos');
      return false;
    }
    
    if (!datosSalon.ciudad.trim()) {
      setError('La ciudad es requerida');
      return false;
    }
    
    setError('');
    return true;
  };

  // Siguiente paso
  const siguientePaso = async () => {
    if (pasoActual === 1) {
      const valido = await validarPaso1();
      if (valido) setPasoActual(2);
    } else if (pasoActual === 2) {
      if (validarPaso2()) setPasoActual(3);
    }
  };

  // Paso anterior
  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
      setError('');
    }
  };

  // Registro final
  const handleRegistro = async () => {
    try {
      setLoading(true);
      setError('');
      
      const supabase = createClient();
      
      // 1. Encriptar contraseña con bcrypt
      const hashedPassword = await bcrypt.hash(datosDueño.password, 10);

      // 2. Obtener plan básico (asumimos que existe un plan con id 'basico')
      const { data: planBasico, error: planError } = await supabase
        .from('planes')
        .select('id')
        .eq('nombre', 'Básico')
        .single();

      if (planError || !planBasico) {
        throw new Error('No se encontró el plan básico');
      }

      // Calcular fecha de vencimiento (15 días desde hoy - periodo de prueba)
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);

      // 3. Crear empresa con campos correctos según estructura real
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .insert({
          nombre: datosSalon.nombre,
          plan_id: (planBasico as any).id,
          estado_suscripcion: 'activa',
          fecha_vencimiento: fechaVencimiento.toISOString()
        } as any)
        .select()
        .single();

      if (empresaError) {
        throw new Error(`Error al crear empresa: ${empresaError.message}`);
      }

      // Captura del ID de empresa
      const empresaId = (empresaData as any)?.id;
      if (!empresaId) {
        throw new Error('No se pudo obtener el ID de la empresa creada');
      }

      // 4. Crear usuario en sistema con contraseña encriptada
      const nuevoUsuarioId = crypto.randomUUID();
      const { error: usuarioError } = await supabase
        .from('usuarios_sistema')
        .insert({
          id: nuevoUsuarioId,
          nombre: datosDueño.nombre,
          email: datosDueño.email.toLowerCase().trim(),
          password_hash: hashedPassword, // CONTRASEÑA ENCRIPTADA CON BCRYPT
          rol: 'admin_empresa',
          empresa_id: empresaId,
          activo: true
        } as any);

      if (usuarioError) {
        // Limpiar empresa si falla el usuario
        await supabase
          .from('empresas')
          .delete()
          .eq('id', empresaId);
        throw new Error(`Error al crear usuario del sistema: ${usuarioError.message}`);
      }

      // 5. Registrar log de auditoría global (auto-registro)
      try {
        await registrarLogAdmin({
          usuario_id: nuevoUsuarioId,
          accion: 'AUTO_REGISTRO_EMPRESA',
          modulo: 'Registro Público',
          detalles: {
            nombre_empresa: datosSalon.nombre,
            email_dueño: datosDueño.email,
            plan_seleccionado: 'Básico'
          }
        });
      } catch (e) {
        console.error('Error en auditoría global (Registro Público):', e);
      }

      // 5. Enviar correo de bienvenida con credenciales (no bloqueante)
      try {
        await enviarCorreoBienvenidaAction(
          datosDueño.email,
          datosDueño.nombre,
          datosDueño.password, // contraseña real, no el hash
          datosSalon.nombre
        );
      } catch (emailError) {
        // Error silencioso - no bloquear el proceso de registro
        console.warn('No se pudo enviar el correo de bienvenida:', emailError);
      }

      // 6. Mostrar éxito y redirigir al login
      showToast('¡Cuenta creada exitosamente! ¡Revisa tu correo! Te hemos enviado tus credenciales de acceso.', 'success');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      console.error('Error en registro:', error);
      setError(error instanceof Error ? error.message : 'Error al completar el registro');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de cada paso
  const renderPaso = () => {
    switch (pasoActual) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <UserIcon className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Datos del Dueño</h2>
              <p className="text-gray-600 mt-2">Comencemos con tu información personal</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre-dueño">Nombre completo</Label>
                <Input
                  id="nombre-dueño"
                  type="text"
                  placeholder="Juan Pérez"
                  value={datosDueño.nombre}
                  onChange={(e) => setDatosDueño({ ...datosDueño, nombre: e.target.value })}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="email-dueño">Email</Label>
                <Input
                  id="email-dueño"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={datosDueño.email}
                  onChange={(e) => setDatosDueño({ ...datosDueño, email: e.target.value })}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="password-dueño">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password-dueño"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={datosDueño.password}
                    onChange={(e) => setDatosDueño({ ...datosDueño, password: e.target.value })}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">La contraseña debe tener al menos 6 caracteres</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BuildingOfficeIcon className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Datos del Salón</h2>
              <p className="text-gray-600 mt-2">Ahora configuremos tu negocio</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre-salon">Nombre del Salón</Label>
                <Input
                  id="nombre-salon"
                  type="text"
                  placeholder="BeautyPro Salon"
                  value={datosSalon.nombre}
                  onChange={(e) => setDatosSalon({ ...datosSalon, nombre: e.target.value })}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="telefono-salon">Teléfono</Label>
                <Input
                  id="telefono-salon"
                  type="tel"
                  placeholder="1234567890"
                  value={datosSalon.telefono}
                  onChange={(e) => setDatosSalon({ ...datosSalon, telefono: e.target.value })}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="ciudad-salon">Ciudad</Label>
                <Input
                  id="ciudad-salon"
                  type="text"
                  placeholder="Ciudad de Colombía"
                  value={datosSalon.ciudad}
                  onChange={(e) => setDatosSalon({ ...datosSalon, ciudad: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Confirmación</h2>
              <p className="text-gray-600 mt-2">Revisa tus datos antes de crear tu salón</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Dueño</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nombre:</span> {datosDueño.nombre}</p>
                  <p><span className="font-medium">Email:</span> {datosDueño.email}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Salón</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nombre:</span> {datosSalon.nombre}</p>
                  <p><span className="font-medium">Teléfono:</span> {datosSalon.telefono}</p>
                  <p><span className="font-medium">Ciudad:</span> {datosSalon.ciudad}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Plan</h3>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-amber-900 font-medium">Plan Básico</p>
                  <p className="text-amber-700 text-sm">Gratis durante el período de prueba (15 días)</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

 return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">{titular.substring(0, 2).toUpperCase()}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear tu Salón</h1>
          <p className="text-gray-600">Únete a {titular} y gestiona tu negocio como un profesional</p>
        </div>

        {/* Progreso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Paso {pasoActual} de 3</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progreso)}%</span>
          </div>
          <Progress value={progreso} className="w-full" />
          <div className="flex justify-between mt-2">
            <span className={`text-xs ${pasoActual >= 1 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
              Dueño
            </span>
            <span className={`text-xs ${pasoActual >= 2 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
              Salón
            </span>
            <span className={`text-xs ${pasoActual >= 3 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
              Confirmación
            </span>
          </div>
        </div>

        {/* Card principal */}
        <Card>
          <CardContent className="p-8">
            {renderPaso()}
            
            {/* Error */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {/* Botones de navegación */}
            <div className="flex justify-between mt-8">
              {pasoActual > 1 ? (
                <Button
                  variant="outline"
                  onClick={pasoAnterior}
                  disabled={loading}
                  className="px-6"
                >
                  Anterior
                </Button>
              ) : (
                <div></div>
              )}
              
              {pasoActual < 3 ? (
                <Button
                  onClick={siguientePaso}
                  disabled={loading}
                  className="px-6 bg-amber-600 hover:bg-amber-700"
                >
                  {loading ? 'Validando...' : 'Siguiente'}
                </Button>
              ) : (
                <Button
                  onClick={handleRegistro}
                  disabled={loading}
                  className="px-6 bg-amber-600 hover:bg-amber-700"
                >
                  {loading ? 'Creando Salón...' : '¡Crear mi Salón!'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <a href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
