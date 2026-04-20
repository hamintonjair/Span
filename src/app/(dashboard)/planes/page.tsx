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

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

const DialogTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h2>
);

const DialogDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600 mt-1">{children}</p>
);

const DialogFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-6 flex justify-end gap-2">{children}</div>
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
  limite_usuarios?: number;
  limite_sucursales?: number;
  tiene_inventario: boolean;
  tiene_comisiones: boolean;
  tiene_marketing: boolean;
  tiene_nominas: boolean;
  tiene_analytics: boolean;
  soporte_prioritario: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export default function PlansPage() {
  const { user } = useJWTAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
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
    limite_usuarios: 0,
    limite_sucursales: 0,
    tiene_inventario: false,
    tiene_comisiones: false,
    tiene_marketing: false,
    tiene_nominas: false,
    tiene_analytics: false,
    soporte_prioritario: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.rol === 'admin_global') {
      loadPlans();
    }
  }, [user]);

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
          limite_usuarios,
          limite_sucursales,
          tiene_inventario,
          tiene_comisiones,
          tiene_marketing,
          tiene_nominas,
          tiene_analytics,
          soporte_prioritario,
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
        limite_usuarios: plan.limite_usuarios || 0,
        limite_sucursales: plan.limite_sucursales || 0,
        tiene_inventario: plan.tiene_inventario || false,
        tiene_comisiones: plan.tiene_comisiones || false,
        tiene_marketing: plan.tiene_marketing || false,
        tiene_nominas: plan.tiene_nominas || false,
        tiene_analytics: plan.tiene_analytics || false,
        soporte_prioritario: plan.soporte_prioritario || false,
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
      limite_usuarios: plan.limite_usuarios || 0,
      limite_sucursales: plan.limite_sucursales || 0,
      tiene_inventario: plan.tiene_inventario,
      tiene_comisiones: plan.tiene_comisiones,
      tiene_marketing: plan.tiene_marketing,
      tiene_nominas: plan.tiene_nominas,
      tiene_analytics: plan.tiene_analytics,
      soporte_prioritario: plan.soporte_prioritario,
    });
    console.log('🔍 DEBUG: FormData cargado:', {
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      precio: plan.precio
    });
    setIsModalOpen(true);
  };

  const handleSavePlan = async () => {
    try {
      setSaving(true);
      const supabase = createClient();

      const planData = {
        nombre: formData.nombre,
        precio: formData.precio,
        descripcion: formData.descripcion,
        limite_usuarios: formData.limite_usuarios,
        limite_sucursales: formData.limite_sucursales,
        tiene_inventario: formData.tiene_inventario,
        tiene_comisiones: formData.tiene_comisiones,
        tiene_marketing: formData.tiene_marketing,
        tiene_nominas: formData.tiene_nominas,
        tiene_analytics: formData.tiene_analytics,
        soporte_prioritario: formData.soporte_prioritario,
        actualizado_en: new Date().toISOString(),
      };

      console.log('🔍 DEBUG: Guardando plan con datos:', planData);

      let result;
      if (editingPlan) {
        // Actualizar plan existente
        try {
          const { data, error } = await (supabase.from('planes') as any)
            .update({
              nombre: planData.nombre,
              precio: planData.precio,
              descripcion: planData.descripcion,
              limite_usuarios: planData.limite_usuarios,
              limite_sucursales: planData.limite_sucursales,
              tiene_inventario: planData.tiene_inventario,
              tiene_comisiones: planData.tiene_comisiones,
              tiene_marketing: planData.tiene_marketing,
              tiene_nominas: planData.tiene_nominas,
              tiene_analytics: planData.tiene_analytics,
              soporte_prioritario: planData.soporte_prioritario,
              actualizado_en: planData.actualizado_en
            })
            .eq('id', editingPlan.id)
            .select();
          
          result = { data, error };
        } catch (updateError) {
          console.error('Error en update:', updateError);
          result = { data: null, error: updateError as any };
        }
      } else {
        // Crear nuevo plan
        try {
          const { data, error } = await (supabase.from('planes') as any)
            .insert({
              nombre: planData.nombre,
              precio: planData.precio,
              descripcion: planData.descripcion,
              limite_usuarios: planData.limite_usuarios,
              limite_sucursales: planData.limite_sucursales,
              tiene_inventario: planData.tiene_inventario,
              tiene_comisiones: planData.tiene_comisiones,
              tiene_marketing: planData.tiene_marketing,
              tiene_nominas: planData.tiene_nominas,
              tiene_analytics: planData.tiene_analytics,
              soporte_prioritario: planData.soporte_prioritario,
              creado_en: new Date().toISOString(),
              actualizado_en: planData.actualizado_en
            })
            .select();
          
          result = { data, error };
        } catch (insertError) {
          console.error('Error en insert:', insertError);
          result = { data: null, error: insertError as any };
        }
      }

      if (result.error) {
        console.error('Error guardando plan:', result.error);
        return;
      }

      console.log('Plan guardado exitosamente');
      setIsModalOpen(false);
      setEditingPlan(null);
      setFormData({
        nombre: '',
        precio: 0,
        descripcion: '',
        limite_usuarios: 0,
        limite_sucursales: 0,
        tiene_inventario: false,
        tiene_comisiones: false,
        tiene_marketing: false,
        tiene_nominas: false,
        tiene_analytics: false,
        soporte_prioritario: false,
      });
      loadPlans();
    } catch (error) {
      console.error('Error en handleSavePlan:', error);
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
      limite_usuarios: 0,
      limite_sucursales: 0,
      tiene_inventario: false,
      tiene_comisiones: false,
      tiene_marketing: false,
      tiene_nominas: false,
      tiene_analytics: false,
      soporte_prioritario: false,
    });
    setIsModalOpen(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      setDeleting(true);
      const supabase = createClient();

      // Primero, verificar si hay empresas asociadas
      const { data: empresasAsociadas, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nombre')
        .eq('plan_id', planToDelete.id)
        .limit(1);

      if (empresasError) {
        console.error('Error verificando empresas asociadas:', empresasError);
        return;
      }

      // Si hay empresas asociadas, no permitir eliminar
      if (empresasAsociadas && empresasAsociadas.length > 0) {
        alert('No se puede eliminar este plan porque hay empresas suscritas a él. Cámbialas de plan primero.');
        setIsDeleteModalOpen(false);
        setPlanToDelete(null);
        return;
      }

      // Si no hay empresas asociadas, proceder a eliminar
      const { error: deleteError } = await (supabase.from('planes') as any)
        .delete()
        .eq('id', planToDelete.id);

      if (deleteError) {
        console.error('Error eliminando plan:', deleteError);
        alert('Error al eliminar el plan. Inténtalo de nuevo.');
        return;
      }

      console.log('Plan eliminado exitosamente:', planToDelete.nombre);
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
      loadPlans(); // Refrescar la tabla
    } catch (error) {
      console.error('Error en confirmDeletePlan:', error);
      alert('Error al eliminar el plan. Inténtalo de nuevo.');
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
                          ${plan.precio}
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

                  {/* Límites */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <span>Hasta {plan.limite_usuarios || '∞'} usuarios</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                      <span>Hasta {plan.limite_sucursales || '∞'} sucursales</span>
                    </div>
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
                      <Label htmlFor="precio" className="text-sm font-medium text-gray-700">Precio Mensual ($)</Label>
                      <Input
                        id="precio"
                        type="number"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                        placeholder="29.99"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
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
                      <Label htmlFor="limite_usuarios" className="text-sm font-medium text-gray-700">Límite de Usuarios</Label>
                      <Input
                        id="limite_usuarios"
                        type="number"
                        value={formData.limite_usuarios}
                        onChange={(e) => setFormData({ ...formData, limite_usuarios: parseInt(e.target.value) || 0 })}
                        placeholder="0 (ilimitado)"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="limite_sucursales" className="text-sm font-medium text-gray-700">Límite de Sucursales</Label>
                      <Input
                        id="limite_sucursales"
                        type="number"
                        value={formData.limite_sucursales}
                        onChange={(e) => setFormData({ ...formData, limite_sucursales: parseInt(e.target.value) || 0 })}
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
              </div>
            </div>

            <DialogFooter className="mt-8">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePlan} disabled={saving}>
                {saving ? 'Guardando...' : (editingPlan ? 'Actualizar Plan' : 'Crear Plan')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmación de Eliminación */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Eliminar Plan</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {planToDelete && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    ¿Estás seguro de que deseas eliminar el plan <strong>"{planToDelete.nombre}"</strong>?
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    Esta acción eliminará permanentemente el plan y no se puede deshacer.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDeletePlan} 
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
