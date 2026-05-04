import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

// Interfaz para configuración global
interface ConfigGlobal {
  titular: string;
}

const inter = Inter({ subsets: ['latin'] })

// Función para obtener configuración global
async function getConfigGlobal(): Promise<ConfigGlobal | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('configuracion_global')
      .select('titular')
      .single();

    if (error) {
      console.error('Error cargando configuración global:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error general cargando configuración global:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfigGlobal();
  const nombreEmpresa = config?.titular;
  
  return {
    title: `${nombreEmpresa} - Sistema de Gestión`,
    description: `Sistema completo de gestión para tu negocio - ${nombreEmpresa}`,
    icons: {
      icon: '/logo.svg',
      apple: '/logo.svg',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} w-full max-w-[100vw] overflow-x-hidden`} suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
