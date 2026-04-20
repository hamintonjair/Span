import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Singleton pattern - una sola instancia para toda la aplicación
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storage: {
            getItem: (key) => {
              if (typeof window !== 'undefined') {
                return localStorage.getItem(key)
              }
              return null
            },
            setItem: (key, value) => {
              if (typeof window !== 'undefined') {
                localStorage.setItem(key, value)
              }
            },
            removeItem: (key) => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem(key)
              }
            },
          },
        },
        global: {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
        db: {
          schema: 'public',
        },
      }
    )
  }
  return supabaseInstance
}

// Exportar el cliente para uso en componentes del cliente
export const supabase = createClient()
