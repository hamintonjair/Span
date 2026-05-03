'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MainLayout } from '@/components/layout/main-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CurrencyDollarIcon, 
  UsersIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { MODULES_CONFIG, getModulosByCategory } from '@/lib/modulos-config';
import { crearPlanAction, editarPlanAction, eliminarPlanAction } from '@/app/actions/admin';
import { useToast } from '@/components/ui/toast';

// Componentes temporales para CardTitle y CardDescription
const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
);

// Componente Badge temporal
const Badge = ({ children, variant = 'outline', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'success'; 
  className?: string; 
}) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  const variantClasses = {
    outline: 'border border-gray-300 text-gray-700 bg-white',
    default: 'bg-blue-100 text-blue-800 border border-blue-200',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Componentes temporales para Input, Label, Textarea, Switch
const Input = ({ 
  id, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  className = '' 
}: { 
  id?: string; 
  type?: string; 
  value?: string | number; 
  onChange?: (e: any) => void; 
  placeholder?: string; 
  className?: string; 
}) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
  />
);

const Label = ({ children, htmlFor, className = '' }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
  </label>
);

const Textarea = ({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  rows = 3,
  className = '' 
}: { 
  id?: string; 
  value?: string; 
  onChange?: (e: any) => void; 
  placeholder?: string; 
  rows?: number;
  className?: string; 
}) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
  />
);

const Switch = ({ 
  id, 
  checked, 
  onCheckedChange, 
  className = '' 
}: { 
  id?: string; 
  checked?: boolean; 
  onCheckedChange?: (checked: boolean) => void; 
  className?: string; 
}) => (
  <button
    id={id}
    type="button"
    onClick={() => onCheckedChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    } ${className}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// Componente Dialog temporal
const Dialog = ({ children, open, onOpenChange }: { 
  children: React.ReactNode; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

const DialogHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

const DialogTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h2>
);

const DialogDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>
);

const DialogFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`mt-6 flex justify-end gap-2 ${className}`}>{children}</div>
);

// Componente para mostrar módulos del plan
const PlanModules = ({ plan }: { plan: Plan }) => {
  const modulosConfig = MODULES_CONFIG;
  
  console.log('🔍 DEBUG: Plan actual:', plan);
  console.log('🔍 DEBUG: Módulos config:', modulosConfig);
  
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-gray-900">Módulos incluidos:</h4>
      <div className="grid grid-cols-2 gap-2">
        {modulosConfig.map((modulo: any) => {
          const isActive = plan[modulo.campoBD as keyof Plan];
          console.log(`🔍 DEBUG: Módulo ${modulo.nombre}: campoBD=${modulo.campoBD}, valor=${isActive}`);
          return (
            <div 
              key={modulo.key}
              className={`flex items-center gap-1 text-xs rounded px-2 py-1 ${
                isActive 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              <span className="text-base">{modulo.icon}</span>
              <span>{modulo.nombre}</span>
              {isActive ? (
                <CheckCircleIcon className="w-3 h-3 text-green-600" />
              ) : (
                <XCircleIcon className="w-3 h-3 text-gray-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  max_usuarios?: number;
  max_empleados?: number;
  tiene_inventario: boolean;
  tiene_comisiones: boolean;
  tiene_marketing: boolean;
  tiene_nominas: boolean;
  tiene_analytics: boolean;
  soporte_prioritario: boolean;
  tiene_trial_gratis?: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export default function PlansPage() {
  const { user } = useJWTAuth();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);

  // Función para actualizar plan en el estado local (actualización optimista)
  const handlePlanActualizado = (planActualizado: Plan) => {
    setPlans(prev => prev.map(plan => plan.id === planActualizado.id ? planActualizado : plan));
  };

  // Función para agregar plan al estado local (actualización optimista)
  const handlePlanCreado = (nuevoPlan: Plan) => {
    setPlans(prev => [...prev, nuevoPlan]);
  };

  // Función para eliminar plan del estado local (actualización optimista)
  const handlePlanEliminado = (planId: string) => {
    setPlans(prev => prev.filter(plan => plan.id !== planId));
  };
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<any>({
    nombre: '',
    precio: 0,
    descripcion: '',
    max_usuarios: 0,
    max_empleados: 0,
    tiene_inventario: false,
    tiene_comisiones: false,
    tiene_marketing: false,
    tiene_nominas: false,
    tiene_analytics: false,
    soporte_prioritario: false,
    tiene_trial_gratis: false,
  });
  const [saving, setSaving] = useState(false);
  const [ivaGlobal, setIvaGlobal] = useState<number>(19); // Valor por defecto

  useEffect(() => {
    if (user?.rol === 'admin_global') {
      loadPlans();
      loadIVAConfig();
    }
  }, [user]);

  const loadIVAConfig = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('porcentaje_iva')
        .single();

      if (error) {
        console.error('Error cargando configuración IVA:', error);
        return;
      }

      if ((data as any)?.porcentaje_iva) {
        setIvaGlobal((data as any).porcentaje_iva);
        console.log('💰 IVA cargado:', (data as any).porcentaje_iva);
      }
    } catch (error) {
      console.error('Error en loadIVAConfig:', error);
    }
  };

  const calcularPrecioConIVA = (precioBase: number) => {
    return precioBase * (1 + (ivaGlobal / 100));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('planes')
        .select(`
          id,
          nombre,
          precio,
          descripcion,
          max_usuarios,
          max_empleados,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          tiene_nominas,
          tiene_analytics,
          soporte_prioritario,
          tiene_trial_gratis,
          creado_en,
          actualizado_en
        `)
        .order('precio', { ascending: true });

      if (error) {
        console.error('Error cargando planes:', error);
        return;
      }

      // Mapear los datos para asegurar que todos los campos existan
      const plansData = (data || []).map((plan: any) => ({
        id: plan.id,
        nombre: plan.nombre || '',
        precio: plan.precio || 0,
        descripcion: plan.descripcion || '',
        max_usuarios: plan.max_usuarios || 0,
        max_empleados: plan.max_empleados || 0,
        tiene_inventario: plan.tiene_inventario || false,
        tiene_comisiones: plan.tiene_comisiones || false,
        tiene_marketing: plan.tiene_marketing || false,
        tiene_nominas: plan.tiene_nominas || false,
        tiene_analytics: plan.tiene_analytics || false,
        soporte_prioritario: plan.soporte_prioritario || false,
        tiene_trial_gratis: plan.tiene_trial_gratis || false,
        creado_en: plan.creado_en || null,
        actualizado_en: plan.actualizado_en || null,
      }));

      console.log('🔍 DEBUG: Planes cargados:', plansData);
      setPlans(plansData);
    } catch (error) {
      console.error('Error en loadPlans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (plan: Plan) => {
    console.log('🔍 DEBUG: Editando plan:', plan);
    setEditingPlan(plan);
    setFormData({
      nombre: plan.nombre,
      precio: plan.precio,
      descripcion: plan.descripcion || '',
      max_usuarios: plan.max_usuarios || 0,
      max_empleados: plan.max_empleados || 0,
      tiene_inventario: plan.tiene_inventario,
      tiene_comisiones: plan.tiene_comisiones,
      tiene_marketing: plan.tiene_marketing,
      tiene_nominas: plan.tiene_nominas,
      tiene_analytics: plan.tiene_analytics,
      soporte_prioritario: plan.soporte_prioritario,
      tiene_trial_gratis: plan.tiene_trial_gratis,
    });
    console.log('🔍 DEBUG: FormData cargado:', {
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      precio: plan.precio
    });
    setIsModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!user?.id) {
      console.error('Error: No se pudo identificar al administrador');
      showToast('Error: No se pudo identificar al administrador', 'error');
      return;
    }

    try {
      setSaving(true);

      // Debug específico para verificar el valor de tiene_trial_gratis
      console.log('🔍 DEBUG: formData.tiene_trial_gratis =', formData.tiene_trial_gratis);
      console.log('🔍 DEBUG: formData completo =', formData);

      const planData = {
        nombre: formData.nombre,
        precio: calcularPrecioConIVA(formData.precio), // Guardar precio con IVA
        descripcion: formData.descripcion,
        max_usuarios: formData.max_usuarios,
        max_empleados: formData.max_empleados,
        tiene_inventario: formData.tiene_inventario,
        tiene_comisiones: formData.tiene_comisiones,
        tiene_marketing: formData.tiene_marketing,
        tiene_nominas: formData.tiene_nominas,
        tiene_analytics: formData.tiene_analytics,
        soporte_prioritario: formData.soporte_prioritario,
        tiene_trial_gratis: formData.tiene_trial_gratis,
      };

      console.log('🔍 DEBUG: Guardando plan con datos:', {
        ...planData,
        precio_base: formData.precio,
        precio_con_iva: calcularPrecioConIVA(formData.precio)
      });

      let result;
      if (editingPlan) {
        // Actualizar plan existente usando Server Action
        result = await editarPlanAction(editingPlan.id, planData, user.id);
        
        if (result.success && result.data) {
          // Actualización optimista: actualizar el plan en el estado local
          const planActualizado: Plan = {
            id: editingPlan.id,
            nombre: planData.nombre,
            precio: planData.precio,
            descripcion: planData.descripcion || '',
            max_usuarios: planData.max_usuarios || 0,
            max_empleados: planData.max_empleados || 0,
            tiene_inventario: planData.tiene_inventario,
            tiene_comisiones: planData.tiene_comisiones,
            tiene_marketing: planData.tiene_marketing,
            tiene_nominas: planData.tiene_nominas,
            tiene_analytics: planData.tiene_analytics,
            soporte_prioritario: planData.soporte_prioritario,
            tiene_trial_gratis: planData.tiene_trial_gratis,
            creado_en: editingPlan.creado_en,
            actualizado_en: new Date().toISOString()
          };
          handlePlanActualizado(planActualizado);
          showToast('Plan actualizado correctamente', 'success');
        }
      } else {
        // Crear nuevo plan usando Server Action
        result = await crearPlanAction(planData, user.id);
        
        if (result.success && result.data) {
          // Actualización optimista: agregar el nuevo plan al estado local
          const nuevoPlan: Plan = {
            id: result.data.id,
            nombre: planData.nombre,
            precio: planData.precio,
            descripcion: planData.descripcion || '',
            max_usuarios: planData.max_usuarios || 0,
            max_empleados: planData.max_empleados || 0,
            tiene_inventario: planData.tiene_inventario,
            tiene_comisiones: planData.tiene_comisiones,
            tiene_marketing: planData.tiene_marketing,
            tiene_nominas: planData.tiene_nominas,
            tiene_analytics: planData.tiene_analytics,
            soporte_prioritario: planData.soporte_prioritario,
            tiene_trial_gratis: planData.tiene_trial_gratis,
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString()
          };
          handlePlanCreado(nuevoPlan);
          showToast('Plan creado correctamente', 'success');
        }
      }

      if (!result.success) {
        console.error('Error guardando plan:', result.error);
        showToast(result.error || 'Error guardando plan', 'error');
        return;
      }

      console.log('Plan guardado exitosamente');
      setIsModalOpen(false);
      setEditingPlan(null);
      setFormData({
        nombre: '',
        precio: 0,
        descripcion: '',
        max_usuarios: 0,
        max_empleados: 0,
        tiene_inventario: false,
        tiene_comisiones: false,
        tiene_marketing: false,
        tiene_nominas: false,
        tiene_analytics: false,
        soporte_prioritario: false,
        tiene_trial_gratis: false,
      });
    } catch (error) {
      console.error('Error en handleSavePlan:', error);
      showToast('Error inesperado al guardar el plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPlan(null);
    setFormData({
      nombre: '',
      precio: 0,
      descripcion: '',
      max_usuarios: 0,
      max_empleados: 0,
      tiene_inventario: false,
      tiene_comisiones: false,
      tiene_marketing: false,
      tiene_nominas: false,
      tiene_analytics: false,
      soporte_prioritario: false,
      tiene_trial_gratis: false,
    });
    setIsModalOpen(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    if (!user?.id) {
      console.error('Error: No se pudo identificar al administrador');
      showToast('Error: No se pudo identificar al administrador', 'error');
      return;
    }

    try {
      setDeleting(true);

      // Usar Server Action para eliminar plan
      const result = await eliminarPlanAction(planToDelete.id, user.id);

      if (!result.success) {
        console.error('Error eliminando plan:', result.error);
        showToast(result.error || 'Error al eliminar el plan', 'error');
        return;
      }

      // Actualización optimista: eliminar el plan del estado local
      handlePlanEliminado(planToDelete.id);
      showToast('Plan eliminado correctamente', 'success');

      console.log('Plan eliminado exitosamente:', planToDelete.nombre);
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
    } catch (error) {
      console.error('Error en confirmDeletePlan:', error);
      showToast('Error inesperado al eliminar el plan', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getPlanColor = (index: number) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800', 'bg-green-100 text-green-800'];
    return colors[index % colors.length];
  };

  if (!user || user.rol !== 'admin_global') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">No tienes permisos para acceder a esta página</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planes y Beneficios</h1>
            <p className="text-gray-600 mt-2">Gestiona los planes de suscripción y sus beneficios</p>
          </div>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Nuevo Plan
          </Button>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Cargando planes...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <Card key={plan.id} className="relative hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatCurrency(plan.precio)}
                        </span>
                        <span className="text-gray-500">/mes</span>
                      </div>
                    </div>
                    <Badge className={getPlanColor(index)}>
                      Plan {index + 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Descripción */}
                  {plan.descripcion && (
                    <p className="text-sm text-gray-600">{plan.descripcion}</p>
                  )}
                  
                  {/* Prueba gratuita */}
                  {(() => {
                    console.log('🔍 DEBUG UI: Plan', plan.nombre, 'tiene_trial_gratis =', plan.tiene_trial_gratis);
                    console.log('🔍 DEBUG UI: Tipo de tiene_trial_gratis =', typeof plan.tiene_trial_gratis);
                    return plan.tiene_trial_gratis && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">🎁</span>
                          <div>
                            <p className="text-sm font-semibold text-green-800">Prueba Gratuita</p>
                            <p className="text-xs text-green-600">15 días sin compromiso</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Límites */}
                  <div className="space-y-2">
                    {((plan.max_usuarios || 0) > 0 || (plan.max_empleados || 0) > 0) && (
                      <>
                        {(plan.max_usuarios || 0) > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <UsersIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-600">Máx {plan.max_usuarios || 0} usuarios</span>
                          </div>
                        )}
                        {(plan.max_empleados || 0) > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <UsersIcon className="w-4 h-4 text-green-400" />
                            <span className="text-green-600">Máx {plan.max_empleados || 0} empleados</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Beneficios */}
                  <PlanModules plan={plan} />

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPlan(plan)}
                      className="flex-1"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeletePlan(plan)}
                      className="px-3"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Edición */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[1100px] w-[95vw] bg-white rounded-2xl shadow-xl p-8">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan 
                  ? 'Modifica los detalles y beneficios del plan'
                  : 'Configura un nuevo plan de suscripción'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Columna Izquierda: Información Básica y Límites */}
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-4 block">Información Básica</Label>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">Nombre del Plan</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Profesional"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="precio" className="text-sm font-medium text-gray-700">Precio Base ($)</Label>
                      <Input
                        id="precio"
                        type="number"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                        placeholder="25000"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      {formData.precio > 0 && (
                        <div className="text-sm bg-green-50 p-3 rounded-md border border-green-200">
                          <div className="font-semibold text-green-800 mb-1">
                            💰 Valor final a guardar: {formatCurrency(calcularPrecioConIVA(formData.precio))}
                          </div>
                          <div className="text-xs text-gray-600">
                            Base: {formatCurrency(formData.precio)} + IVA ({ivaGlobal}%): {formatCurrency(formData.precio * (ivaGlobal / 100))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describe los beneficios principales de este plan..."
                    rows={3}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-4 block">Límites y Restricciones</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="max_usuarios" className="text-sm font-medium text-gray-700">Máximo de Usuarios</Label>
                      <Input
                        id="max_usuarios"
                        type="number"
                        value={formData.max_usuarios}
                        onChange={(e) => setFormData({ ...formData, max_usuarios: parseInt(e.target.value) || 0 })}
                        placeholder="0 (ilimitado)"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="max_empleados" className="text-sm font-medium text-gray-700">Máximo de Empleados</Label>
                      <Input
                        id="max_empleados"
                        type="number"
                        value={formData.max_empleados}
                        onChange={(e) => setFormData({ ...formData, max_empleados: parseInt(e.target.value) || 0 })}
                        placeholder="0 (ilimitado)"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Módulos y Beneficios */}
              <div className="space-y-6">
                <Label className="text-base font-semibold text-gray-900 mb-4 block">Módulos y Beneficios</Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Inventario */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition-all h-full">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📦</span>
                      <div className="flex-1">
                        <Label htmlFor="tiene_inventario" className="text-sm font-semibold text-gray-800">Inventario</Label>
                        <p className="text-xs text-gray-600 mt-1">Control de stock y productos</p>
                      </div>
                    </div>
                    <Switch
                      id="tiene_inventario"
                      checked={formData.tiene_inventario}
                      onCheckedChange={(checked) => setFormData({ ...formData, tiene_inventario: checked })}
                      className="scale-110"
                    />
                  </div>

                  {/* Comisiones */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-md transition-all h-full">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <div className="flex-1">
                        <Label htmlFor="tiene_comisiones" className="text-sm font-semibold text-gray-800">Comisiones</Label>
                        <p className="text-xs text-gray-600 mt-1">Cálculo de pagos a empleados</p>
                      </div>
                    </div>
                    <Switch
                      id="tiene_comisiones"
                      checked={formData.tiene_comisiones}
                      onCheckedChange={(checked) => setFormData({ ...formData, tiene_comisiones: checked })}
                      className="scale-110"
                    />
                  </div>

                  {/* Marketing */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:shadow-md transition-all h-full">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📢</span>
                      <div className="flex-1">
                        <Label htmlFor="tiene_marketing" className="text-sm font-semibold text-gray-800">Marketing</Label>
                        <p className="text-xs text-gray-600 mt-1">Envío de promociones</p>
                      </div>
                    </div>
                    <Switch
                      id="tiene_marketing"
                      checked={formData.tiene_marketing}
                      onCheckedChange={(checked) => setFormData({ ...formData, tiene_marketing: checked })}
                      className="scale-110"
                    />
                  </div>

                  {/* Nóminas */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl hover:shadow-md transition-all h-full">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💳</span>
                      <div className="flex-1">
                        <Label htmlFor="tiene_nominas" className="text-sm font-semibold text-gray-800">Nóminas</Label>
                        <p className="text-xs text-gray-600 mt-1">Gestión de pagos y comisiones</p>
                      </div>
                    </div>
                    <Switch
                      id="tiene_nominas"
                      checked={formData.tiene_nominas}
                      onCheckedChange={(checked) => setFormData({ ...formData, tiene_nominas: checked })}
                      className="scale-110"
                    />
                  </div>

                  {/* Analytics */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl hover:shadow-md transition-all h-full">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📊</span>
                      <div className="flex-1">
                        <Label htmlFor="tiene_analytics" className="text-sm font-semibold text-gray-800">Analytics</Label>
                        <p className="text-xs text-gray-600 mt-1">Análisis avanzado de datos</p>
                      </div>
                    </div>
                    <Switch
                      id="tiene_analytics"
                      checked={formData.tiene_analytics}
                      onCheckedChange={(checked) => setFormData({ ...formData, tiene_analytics: checked })}
                      className="scale-110"
                    />
                  </div>

                  {/* Soporte Prioritario */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl hover:shadow-md transition-all h-full">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⭐</span>
                      <div className="flex-1">
                        <Label htmlFor="soporte_prioritario" className="text-sm font-semibold text-gray-800">Soporte Prioritario</Label>
                        <p className="text-xs text-gray-600 mt-1">Atención prioritaria 24/7</p>
                      </div>
                    </div>
                    <Switch
                      id="soporte_prioritario"
                      checked={formData.soporte_prioritario}
                      onCheckedChange={(checked) => setFormData({ ...formData, soporte_prioritario: checked })}
                      className="scale-110"
                    />
                  </div>
                </div>

                {/* Prueba Gratuita */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎁</span>
                    <div className="flex-1">
                      <Label htmlFor="tiene_trial_gratis" className="text-sm font-semibold text-gray-800">Prueba Gratuita</Label>
                      <p className="text-xs text-gray-600 mt-1">15 días sin compromiso</p>
                    </div>
                  </div>
                  <Switch
                    id="tiene_trial_gratis"
                    checked={formData.tiene_trial_gratis}
                    onCheckedChange={(checked) => setFormData({ ...formData, tiene_trial_gratis: checked })}
                    className="scale-110"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePlan} disabled={saving}>
                {saving ? 'Guardando...' : (editingPlan ? 'Actualizar Plan' : 'Crear Plan')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmación de Eliminación */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[420px] bg-white px-6">
            <DialogHeader className="space-y-3">
              {/* Icono de advertencia */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mt-6 mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <DialogTitle className="text-center text-xl font-bold text-gray-900">
                ¿Eliminar plan "{planToDelete?.nombre}"?
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600">
                Esta acción no se puede deshacer. El plan se eliminará permanentemente del sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {planToDelete && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  {/* Información del Plan */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nombre:</span>
                    <span className="text-sm font-semibold text-gray-900">{planToDelete.nombre}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Precio:</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(planToDelete.precio)}/mes</span>
                  </div>

                  {/* Límites */}
                  {((planToDelete.max_usuarios || 0) > 0 || (planToDelete.max_empleados || 0) > 0) && (
                    <div className="pt-2 border-t border-gray-200 space-y-2">
                      {(planToDelete.max_usuarios || 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Máx. Usuarios:</span>
                          <span className="text-sm font-medium text-gray-900">{planToDelete.max_usuarios}</span>
                        </div>
                      )}
                      {(planToDelete.max_empleados || 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Máx. Empleados:</span>
                          <span className="text-sm font-medium text-gray-900">{planToDelete.max_empleados}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Módulos incluidos */}
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Módulos incluidos:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {planToDelete.tiene_inventario && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          📦 Inventario
                        </span>
                      )}
                      {planToDelete.tiene_comisiones && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          💰 Comisiones
                        </span>
                      )}
                      {planToDelete.tiene_marketing && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          📢 Marketing
                        </span>
                      )}
                      {planToDelete.tiene_nominas && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          💳 Nóminas
                        </span>
                      )}
                      {planToDelete.tiene_analytics && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                          📊 Analytics
                        </span>
                      )}
                      {planToDelete.soporte_prioritario && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⭐ Soporte Prioritario
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Advertencia adicional */}
              <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">
                  <strong>Importante:</strong> Si hay empresas suscritas a este plan, no podrás eliminarlo hasta que cambien de plan.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg mb-2"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeletePlan}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg mb-2"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Eliminando...
                  </span>
                ) : (
                  'Eliminar Plan'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
