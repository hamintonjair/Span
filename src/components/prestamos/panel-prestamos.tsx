'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';

// Tipos temporales
interface EmpleadoConPrestamo {
  id: string;
  nombre: string;
  email: string;
  sueldo_base: number;
  prestamo_activo?: {
    id: string;
    monto_total: number;
    saldo_pendiente: number;
    cuota_mensual: number;
    fecha_limite: string;
    estado: 'activo' | 'pagado' | 'vencido';
  };
}

interface PanelPrestamosProps {
  empresaId: string;
}

export function PanelPrestamos({ empresaId }: PanelPrestamosProps) {
  const [empleados, setEmpleados] = useState<EmpleadoConPrestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNuevoPrestamoModal, setShowNuevoPrestamoModal] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string>('');
  const [formData, setFormData] = useState({
    monto_total: '',
    cuota_mensual: '',
    fecha_limite: '',
    descripcion: ''
  });
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarEmpleados();
  }, [empresaId]);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      
      // Simulación de datos - en producción llamaríamos a los servicios
      const empleadosMock: EmpleadoConPrestamo[] = [
        {
          id: '1',
          nombre: 'Juan Pérez',
          email: 'juan@salon.com',
          sueldo_base: 5000,
          prestamo_activo: {
            id: '1',
            monto_total: 3000,
            saldo_pendiente: 1800,
            cuota_mensual: 300,
            fecha_limite: '2024-02-15',
            estado: 'activo'
          }
        },
        {
          id: '2',
          nombre: 'María García',
          email: 'maria@salon.com',
          sueldo_base: 4500,
          prestamo_activo: {
            id: '2',
            monto_total: 1500,
            saldo_pendiente: 500,
            cuota_mensual: 250,
            fecha_limite: '2024-01-20',
            estado: 'activo'
          }
        },
        {
          id: '3',
          nombre: 'Laura Martínez',
          email: 'laura@salon.com',
          sueldo_base: 4800,
          prestamo_activo: undefined
        },
        {
          id: '4',
          nombre: 'Carlos Rodríguez',
          email: 'carlos@salon.com',
          sueldo_base: 4200,
          prestamo_activo: {
            id: '3',
            monto_total: 2000,
            saldo_pendiente: 0,
            cuota_mensual: 200,
            fecha_limite: '2023-12-15',
            estado: 'pagado'
          }
        }
      ];

      setEmpleados(empleadosMock);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoPrestamo = async () => {
    if (!empleadoSeleccionado || !formData.monto_total || !formData.cuota_mensual) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    setProcesando(true);
    try {
      // Aquí llamaríamos al servicio de crear préstamo
      // await crearPrestamo({
      //   empleado_id: empleadoSeleccionado,
      //   empresa_id: empresaId,
      //   monto_total: parseFloat(formData.monto_total),
      //   cuota_mensual: parseFloat(formData.cuota_mensual),
      //   fecha_limite: formData.fecha_limite,
      //   descripcion: formData.descripcion
      // });

      // Simulación
      await new Promise(resolve => setTimeout(resolve, 1500));

      alert('Préstamo registrado exitosamente');
      setShowNuevoPrestamoModal(false);
      setEmpleadoSeleccionado('');
      setFormData({
        monto_total: '',
        cuota_mensual: '',
        fecha_limite: '',
        descripcion: ''
      });
      await cargarEmpleados();
    } catch (error) {
      console.error('Error al crear préstamo:', error);
      alert('Error al registrar el préstamo');
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'pagado': return 'bg-blue-100 text-blue-800';
      case 'vencido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'pagado': return 'Pagado';
      case 'vencido': return 'Vencido';
      default: return estado;
    }
  };

  const calcularTotalPrestado = () => {
    return empleados.reduce((sum, emp) => 
      sum + (emp.prestamo_activo?.monto_total || 0), 0
    );
  };

  const calcularTotalPendiente = () => {
    return empleados.reduce((sum, emp) => 
      sum + (emp.prestamo_activo?.saldo_pendiente || 0), 0
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Panel de Préstamos</h2>
              <p className="text-sm text-gray-600">Gestión de préstamos a empleados</p>
            </div>
            <Button
              onClick={() => setShowNuevoPrestamoModal(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Nuevo Préstamo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Prestado</p>
              <p className="text-2xl font-bold text-blue-900">
                ${calcularTotalPrestado().toFixed(2)}
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-600 font-medium">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-amber-900">
                ${calcularTotalPendiente().toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Empleados con Deuda</p>
              <p className="text-2xl font-bold text-green-900">
                {empleados.filter(emp => emp.prestamo_activo?.estado === 'activo').length}
              </p>
            </div>
          </div>

          {/* Tabla de empleados */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Empleado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Sueldo Base</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Préstamo Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Saldo Pendiente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Cuota Mensual</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((empleado) => (
                  <tr key={empleado.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{empleado.nombre}</p>
                        <p className="text-sm text-gray-500">{empleado.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">
                        ${empleado.sueldo_base.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {empleado.prestamo_activo ? (
                        <span className="font-medium">
                          ${empleado.prestamo_activo.monto_total.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {empleado.prestamo_activo ? (
                        <span className={`font-medium ${
                          empleado.prestamo_activo.saldo_pendiente > 0 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          ${empleado.prestamo_activo.saldo_pendiente.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {empleado.prestamo_activo ? (
                        <span className="font-medium">
                          ${empleado.prestamo_activo.cuota_mensual.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {empleado.prestamo_activo ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(empleado.prestamo_activo.estado)}`}>
                          {getEstadoTexto(empleado.prestamo_activo.estado)}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Sin préstamo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {empleado.prestamo_activo?.estado === 'activo' && (
                          <Button size="sm" variant="outline">
                            Ver Detalles
                          </Button>
                        )}
                        {!empleado.prestamo_activo && (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setEmpleadoSeleccionado(empleado.id);
                              setShowNuevoPrestamoModal(true);
                            }}
                          >
                            Otorgar Préstamo
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {empleados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay empleados registrados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Nuevo Préstamo */}
      <Modal
        isOpen={showNuevoPrestamoModal}
        onClose={() => setShowNuevoPrestamoModal(false)}
        title="Registrar Nuevo Préstamo"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empleado
            </label>
            <select
              value={empleadoSeleccionado}
              onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Seleccionar empleado...</option>
              {empleados.filter(emp => !emp.prestamo_activo || emp.prestamo_activo.estado === 'pagado').map(empleado => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre} - Sueldo: ${empleado.sueldo_base.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Monto Total del Préstamo"
            type="number"
            step="0.01"
            value={formData.monto_total}
            onChange={(e) => setFormData({...formData, monto_total: e.target.value})}
            placeholder="0.00"
          />

          <Input
            label="Cuota Mensual"
            type="number"
            step="0.01"
            value={formData.cuota_mensual}
            onChange={(e) => setFormData({...formData, cuota_mensual: e.target.value})}
            placeholder="0.00"
          />

          <Input
            label="Fecha Límite de Pago"
            type="date"
            value={formData.fecha_limite}
            onChange={(e) => setFormData({...formData, fecha_limite: e.target.value})}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Motivo del préstamo..."
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleNuevoPrestamo}
              disabled={procesando}
              className="flex-1"
            >
              {procesando ? 'Procesando...' : 'Registrar Préstamo'}
            </Button>
            <Button
              onClick={() => setShowNuevoPrestamoModal(false)}
              variant="outline"
              disabled={procesando}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
