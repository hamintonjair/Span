# Configuración de shadcn/ui

## Pasos para instalar shadcn/ui

1. **Ejecutar el comando de inicialización:**
```bash
npx shadcn-ui@latest init
```

2. **Configurar las opciones:**
- Would you like to use TypeScript? → **Yes**
- Which style would you like to use? → **New York** (o Default)
- Which color would you like to use as base color? → **Slate**
- Where is your global CSS file? → **src/app/globals.css**
- Would you like to use CSS variables for colors? → **Yes**
- Where is your tailwind.config.js located? → **tailwind.config.js**
- Configure the import alias for components? → **@/components**
- Configure the import alias for utils? → **@/lib/utils**

3. **Instalar los componentes necesarios:**
```bash
npx shadcn-ui@latest add button card input label select textarea dialog sheet sidebar table badge avatar dropdown-menu separator
```

4. **Crear lib/utils.ts (si no existe):**
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Componentes que usaremos

- **Button**: Botones interactivos
- **Card**: Contenedores de contenido
- **Input/Label**: Formularios
- **Dialog**: Modales
- **Sheet**: Paneles laterales
- **Sidebar**: Navegación lateral
- **Table**: Tablas de datos
- **Badge**: Etiquetas de estado
- **Avatar**: Perfiles de usuario
- **DropdownMenu**: Menús desplegables
- **Separator**: Divisores visuales

Una vez instalado, podemos proceder con la creación de los componentes.
