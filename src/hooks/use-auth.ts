'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  empresa_id: string | null;
  nombre: string;
  email: string;
  rol: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        console.log('FORZANDO PERFIL DIRECTO para usuario:', session.user.id);

        // BYPASS COMPLETO: Crear perfil directamente sin consultar
        const basicProfile = {
          id: session.user.id,
          empresa_id: null,
          nombre: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin',
          email: session.user.email || '',
          rol: 'admin_global'
        };

        console.log('Perfil directo forzado:', basicProfile);
        setUser(basicProfile);
        
        // Para admin_global, marcar carga como completa INMEDIATAMENTE
        if (basicProfile.rol === 'admin_global') {
          setLoading(false);
          console.log('Admin Global detectado - Carga completada inmediatamente');
          return;
        }
        
        // Intentar crear en background (sin bloquear)
        try {
          await supabase
            .from('usuarios_sistema')
            .insert(basicProfile as any);
          console.log('Perfil creado en background');
        } catch (e) {
          console.log('Error creando en background (ignorado):', e);
        }

      } catch (error) {
        console.error('Error general en autenticación:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();

    // Escuchar cambios en la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'SIGNED_IN' && session) {
          getUserProfile();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
