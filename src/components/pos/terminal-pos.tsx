'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';

// Tipos temporales hasta que definamos las tablas completas
interface Cita {
  id: string;
  cliente_nombre: string;
  empleado_nombre: string;
  servicio: string;
  hora: string;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  monto_base: number;
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
}

interface ServicioExtra {
  id: string;
  nombre: string;
  precio: number;
  duracion: number;
}

interface TerminalPOSProps {
  empresaId: string;
}

export function TerminalPOS({ empresaId }: TerminalPOSProps) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [showUpsellingModal, setShowUpsellingModal] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [serviciosExtras, setServiciosExtras] = useState<ServicioExtra[]>([]);
  const [itemsAdicionales, setItemsAdicionales] = useState<Array<{
    tipo: 'producto' | 'servicio';
    id: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [empresaId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Simulación de datos - en producción llamaríamos a los servicios
      const citasMock: Cita[] = [
        {
          id: '1',
          cliente_nombre: 'María García',
          empleado_nombre: 'Juan Pérez',
          servicio: 'Corte y Tinte',
          hora: '10:00',
          estado: 'pendiente',
          monto_base: 500
        },
        {
          id: '2',
          cliente_nombre: 'Ana López',
          empleado_nombre: 'Laura Martínez',
          servicio: 'Manicure',
          hora: '11:00',
          estado: 'en_progreso',
          monto_base: 200
        },
        {
          id: '3',
          cliente_nombre: 'Sofía Rodríguez',
          empleado_nombre: 'Juan Pérez',
          servicio: 'Tratamiento Facial',
          hora: '12:00',
          estado: 'pendiente',
          monto_base: 350
        }
      ];

      const productosMock: Producto[] = [
        { id: '1', nombre: 'Shampoo Premium', precio: 150, stock: 25 },
        { id: '2', nombre: 'Acondicionador', precio: 120, stock: 18 },
        { id: '3', nombre: 'Serum Capilar', precio: 200, stock: 12 },
        { id: '4', nombre: 'Mascarilla Facial', precio: 80, stock: 30 }
      ];

      const serviciosExtrasMock: ServicioExtra[] = [
        { id: '1', nombre: 'Tratamiento de Keratina', precio: 300, duracion: 30 },
        { id: '2', nombre: 'Masaje Capilar', precio: 100, duracion: 15 },
        { id: '3', nombre: 'Aplicación de Color', precio: 250, duracion: 45 }
      ];

      setCitas(citasMock);
      setProductos(productosMock);
      setServiciosExtras(serviciosExtrasMock);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarCita = (cita: Cita) => {
    setCitaSeleccionada(cita);
    setShowUpsellingModal(true);
    setItemsAdicionales([]);
  };

  const handleAgregarItem = (tipo: 'producto' | 'servicio', item: Producto | ServicioExtra) => {
    const itemExistente = itemsAdicionales.find(
      i => i.tipo === tipo && i.id === item.id
    );

    if (itemExistente) {
      setItemsAdicionales(itemsAdicionales.map(i =>
        i.tipo === tipo && i.id === item.id
          ? { ...i, cantidad: i.cantidad + 1, total: (i.cantidad + 1) * i.precio_unitario }
          : i
      ));
    } else {
      setItemsAdicionales([
        ...itemsAdicionales,
        {
          tipo,
          id: item.id,
          nombre: item.nombre,
          cantidad: 1,
          precio_unitario: item.precio,
          total: item.precio
        }
      ]);
    }
  };

  const handleActualizarCantidad = (index: number, cantidad: number) => {
    if (cantidad <= 0) {
      setItemsAdicionales(itemsAdicionales.filter((_, i) => i !== index));
    } else {
      setItemsAdicionales(itemsAdicionales.map((item, i) =>
        i === index
          ? { ...item, cantidad, total: cantidad * item.precio_unitario }
          : item
      ));
    }
  };

  const calcularTotal = () => {
    const base = citaSeleccionada?.monto_base || 0;
    const adicionales = itemsAdicionales.reduce((sum, item) => sum + item.total, 0);
    return base + adicionales;
  };

  const handleProcesarVenta = async () => {
    if (!citaSeleccionada) return;

    setProcesando(true);
    try {
      // Aquí llamaríamos al servicio de actualizarVentaCita
      // await actualizarVentaCita(citaSeleccionada.id, empresaId, itemsAdicionales);
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Venta procesada exitosamente');
      setShowUpsellingModal(false);
      setCitaSeleccionada(null);
      setItemsAdicionales([]);
      await cargarDatos();
    } catch (error) {
      console.error('Error al procesar venta:', error);
      alert('Error al procesar la venta');
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_progreso': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
          <h2 className="text-xl font-semibold text-gray-900">Terminal Punto de Venta</h2>
          <p className="text-sm text-gray-600">Citas del día - {new Date().toLocaleDateString('es-MX')}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {citas.map((cita) => (
              <div
                key={cita.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">{cita.cliente_nombre}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(cita.estado)}`}>
                        {cita.estado.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>{cita.servicio} • {cita.empleado_nombre}</p>
                      <p>{cita.hora} • ${cita.monto_base.toFixed(2)}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSeleccionarCita(cita)}
                    disabled={cita.estado === 'completada'}
                    className="ml-4"
                  >
                    {cita.estado === 'completada' ? 'Completada' : 'Cobrar'}
                  </Button>
                </div>
              </div>
            ))}
            
            {citas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay citas programadas para hoy
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Upselling */}
      <Modal
        isOpen={showUpsellingModal}
        onClose={() => setShowUpsellingModal(false)}
        title={`Cobrar - ${citaSeleccionada?.cliente_nombre}`}
        size="xl"
      >
        {citaSeleccionada && (
          <div className="space-y-6">
            {/* Información de la cita */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Servicio Principal</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">{citaSeleccionada.servicio}</p>
                  <p className="text-sm text-gray-600">Estilista: {citaSeleccionada.empleado_nombre}</p>
                </div>
                <p className="font-medium">${citaSeleccionada.monto_base.toFixed(2)}</p>
              </div>
            </div>

            {/* Productos adicionales */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Productos Adicionales</h4>
              <div className="grid grid-cols-2 gap-3">
                {productos.map((producto) => (
                  <div key={producto.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{producto.nombre}</p>
                        <p className="text-xs text-gray-500">Stock: {producto.stock}</p>
                      </div>
                      <p className="font-medium text-sm">${producto.precio.toFixed(2)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAgregarItem('producto', producto)}
                      disabled={producto.stock === 0}
                      className="w-full"
                    >
                      {producto.stock === 0 ? 'Sin stock' : 'Agregar'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Servicios adicionales */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Servicios Extra</h4>
              <div className="grid grid-cols-2 gap-3">
                {serviciosExtras.map((servicio) => (
                  <div key={servicio.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{servicio.nombre}</p>
                        <p className="text-xs text-gray-500">{servicio.duracion} min</p>
                      </div>
                      <p className="font-medium text-sm">${servicio.precio.toFixed(2)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAgregarItem('servicio', servicio)}
                      className="w-full"
                    >
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Items seleccionados */}
            {itemsAdicionales.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Items Adicionales</h4>
                <div className="space-y-2">
                  {itemsAdicionales.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.nombre}</p>
                        <p className="text-xs text-gray-500">
                          ${item.precio_unitario.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          value={item.cantidad}
                          onChange={(e) => handleActualizarCantidad(index, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <p className="font-medium text-sm w-20 text-right">
                          ${item.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total a pagar:</span>
                <span className="text-2xl font-bold text-amber-600">
                  ${calcularTotal().toFixed(2)}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleProcesarVenta}
                  disabled={procesando}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {procesando ? 'Procesando...' : 'Procesar Venta'}
                </Button>
                <Button
                  onClick={() => setShowUpsellingModal(false)}
                  variant="outline"
                  disabled={procesando}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
