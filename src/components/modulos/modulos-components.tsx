'use client';

import { useState, useEffect } from 'react';
import { getModulosEmpresa, EmpresaModulos, getModulosConfig } from '@/lib/modulos';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

/**
 * Hook personalizado para verificar módulos en componentes React
 */
export function useModulosEmpresa(empresaId?: string) {
  const [modulos, setModulos] = useState<EmpresaModulos | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresaId) {
      cargarModulos();
    }
  }, [empresaId]);

  const cargarModulos = async () => {
    if (!empresaId) return;
    
    setLoading(true);
    try {
      const modulosData = await getModulosEmpresa(empresaId);
      setModulos(modulosData);
    } catch (error) {
      console.error('Error cargando módulos:', error);
    } finally {
      setLoading(false);
    }
  };

  return { modulos, loading, refrescar: cargarModulos };
}

/**
 * Componente para mostrar el estado de un módulo
 */
export function ModuloStatus({ 
  activo, 
  nombre, 
  icon, 
  descripcion 
}: { 
  activo: boolean; 
  nombre: string; 
  icon: string; 
  descripcion?: string; 
}) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
      activo 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-gray-100 text-gray-500 border border-gray-200'
    }`}>
      <span className="text-base">{icon}</span>
      <div>
        <div className="font-medium">{nombre}</div>
        {descripcion && (
          <div className="text-xs opacity-75">{descripcion}</div>
        )}
      </div>
      {activo ? (
        <CheckCircleIcon className="w-4 h-4 text-green-600" />
      ) : (
        <XCircleIcon className="w-4 h-4 text-gray-400" />
      )}
    </div>
  );
}

/**
 * Componente para mostrar todos los módulos de una empresa
 */
export function ModulosEmpresa({ empresaId }: { empresaId: string }) {
  const { modulos, loading } = useModulosEmpresa(empresaId);

  if (loading) {
    return <div className="text-gray-500">Cargando módulos...</div>;
  }

  if (!modulos) {
    return <div className="text-red-500">No se pudieron cargar los módulos</div>;
  }

  const modulosConfig = getModulosConfig();

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Módulos Activos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modulosConfig.map(modulo => (
          <ModuloStatus
            key={modulo.key}
            activo={modulos[modulo.key]}
            nombre={modulo.nombre}
            icon={modulo.icon}
            descripcion={modulo.descripcion}
          />
        ))}
      </div>
    </div>
  );
}
