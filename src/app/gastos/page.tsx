'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  empresa_id: string;
  creado_por: string;
  created_at: string;
}

export default function GastosPage() {
  const { user, loading } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: 0,
    categoria: 'general',
    fecha: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const supabase = createClient();

  useEffect(() => {
    if (user?.empresa_id) {
      cargarGastos();
    }
  }, [user]);

  const cargarGastos = async () => {
    if (!user?.empresa_id) return;

    try {
      setLoadingData(true);
      
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setGastos(data || []);
    } catch (error) {
      console.error('Error cargando gastos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleGuardarGasto = async () => {
    if (!user?.empresa_id || !formData.descripcion || formData.monto <= 0) return;

    try {
      // TEMPORAL: Simulación hasta crear la tabla gastos
      console.log('Gasto a guardar:', {
        descripcion: formData.descripcion,
        monto: formData.monto,
        categoria: formData.categoria,
        fecha: formData.fecha,
        empresa_id: user.empresa_id,
        creado_por: user.id
      });

      alert('Gasto registrado exitosamente (simulado - tabla gastos no existe)');
      setShowModal(false);
      setEditingGasto(null);
      setFormData({
        descripcion: '',
        monto: 0,
        categoria: 'general',
        fecha: new Date().toISOString().split('T')[0]
      });
      
      // await cargarGastos(); // Comentado hasta crear tabla
    } catch (error) {
      console.error('Error guardando gasto:', error);
      alert('Error al guardar el gasto');
    }
  };

  const handleEditarGasto = (gasto: Gasto) => {
    setEditingGasto(gasto);
    setFormData({
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      categoria: gasto.categoria,
      fecha: gasto.fecha
    });
    setShowModal(true);
  };

  const handleEliminarGasto = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Gasto eliminado exitosamente');
      await cargarGastos();
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      alert('Error al eliminar el gasto');
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'insumos': return 'bg-blue-100 text-blue-800';
      case 'servicios': return 'bg-purple-100 text-purple-800';
      case 'nomina': return 'bg-green-100 text-green-800';
      case 'renta': return 'bg-yellow-100 text-yellow-800';
      case 'marketing': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredGastos = gastos.filter(gasto =>
    gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gasto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGastos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGastos = filteredGastos.slice(startIndex, startIndex + itemsPerPage);

  // Calcular totales
  const totalGastos = filteredGastos.reduce((sum, gasto) => sum + gasto.monto, 0);
  const gastosPorCategoria = filteredGastos.reduce((acc, gasto) => {
    acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.monto;
    return acc;
  }, {} as Record<string, number>);

  if (loading || loadingData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando gastos...</div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !user.empresa_id) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: No se pudo obtener el ID de la empresa</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🧾 Gastos</h1>
            <p className="text-gray-600">Registro de egresos y gastos operativos</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            + Nuevo Gasto
          </Button>
        </div>

        {/* Resumen de Gastos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                ${totalGastos.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Total Gastos</p>
            </CardContent>
          </Card>
          
          {Object.entries(gastosPorCategoria).map(([categoria, monto]) => (
            <Card key={categoria}>
              <CardContent className="p-4">
                <div className="text-lg font-semibold text-gray-900">
                  ${monto.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 capitalize">{categoria}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Búsqueda */}
        <Card>
          <CardContent className="p-4">
            <Input
              placeholder="Buscar por descripción o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Tabla de Gastos */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Lista de Gastos ({filteredGastos.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedGastos.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(gasto.fecha).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {gasto.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoriaColor(gasto.categoria)}`}>
                          {gasto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                        ${gasto.monto.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarGasto(gasto)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEliminarGasto(gasto.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {paginatedGastos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron gastos
                </div>
              )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredGastos.length)} de {filteredGastos.length} resultados
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Nuevo/Editar Gasto */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingGasto(null);
            setFormData({
              descripcion: '',
              monto: 0,
              categoria: 'general',
              fecha: new Date().toISOString().split('T')[0]
            });
          }}
          title={editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción del gasto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                >
                  <option value="general">General</option>
                  <option value="insumos">Insumos</option>
                  <option value="servicios">Servicios</option>
                  <option value="nomina">Nómina</option>
                  <option value="renta">Renta</option>
                  <option value="marketing">Marketing</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="impuestos">Impuestos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button className="flex-1" onClick={handleGuardarGasto}>
                {editingGasto ? 'Actualizar' : 'Registrar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setEditingGasto(null);
                  setFormData({
                    descripcion: '',
                    monto: 0,
                    categoria: 'general',
                    fecha: new Date().toISOString().split('T')[0]
                  });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
