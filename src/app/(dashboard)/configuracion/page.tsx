'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { getDirectDriveUrl } from '@/utils/drive-url';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BuildingOfficeIcon, PhoneIcon, MapPinIcon, DocumentTextIcon, PhotoIcon, CheckCircleIcon, ExclamationTriangleIcon, CreditCardIcon, CalendarIcon, LockClosedIcon } from '@heroicons/react/24/outline';

// Eliminamos interfaces para evitar errores de TypeScript

export default function ConfiguracionPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    nombre: '',
    nit: '',
    telefono: '',
    direccion: '',
    ciudad: 'Quibdó',
    mensaje_ticket: '',
    logo_url: ''
  }); // Cast explícito para evitar errores de TypeScript

  // Estados para manejo de logo
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string>('');

  // Validar y procesar archivo de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (500KB)
    if (file.size > 500 * 1024) {
      setLogoError('El archivo no debe superar los 500 KB');
      return;
    }

    // Validar formato
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('El formato debe ser JPG, PNG o WebP');
      return;
    }

    setLogoError('');
    setLogoFile(file);

    // Convertir a Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setLogoPreview(base64String);
      setFormData((prev: any) => ({
        ...prev,
        logo_url: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  // Eliminar logo
  const handleEliminarLogo = () => {
    setLogoPreview('');
    setLogoFile(null);
    setFormData((prev: any) => ({
      ...prev,
      logo_url: ''
    }));
    setLogoError('');
  };

  // Cargar datos de la empresa usando empresa_id del usuario
  const cargarEmpresa = async () => {
    if (!user?.empresa_id) return;

    try {
      setLoading(true);
      // Primero intentamos con las columnas básicas que sabemos que existen
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nombre, nit, telefono, direccion, ciudad, mensaje_ticket, logo_url')
        .eq('id', user.empresa_id)
        .single();

      if (error) throw error;
      
      if (data) {
        // Cast explícito para evitar errores de TypeScript
        const empresaData = data as any;
        setEmpresa(empresaData);
        setFormData({
          nombre: empresaData.nombre || '',
          nit: empresaData.nit || '',
          telefono: empresaData.telefono || '',
          direccion: empresaData.direccion || '',
          ciudad: empresaData.ciudad || 'Quibdó', // Valor por defecto
          mensaje_ticket: empresaData.mensaje_ticket || '',
          logo_url: empresaData.logo_url || ''
        } as any); // Cast explícito para evitar errores de TypeScript
        
        // Establecer preview si existe logo
        if (empresaData.logo_url) {
          setLogoPreview(empresaData.logo_url);
        }
      }
    } catch (error) {
      console.error('Error cargando empresa:', error);
      setMessage({ type: 'error', text: 'Error al cargar los datos de la empresa' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.empresa_id) {
      cargarEmpresa();
    }
  }, [user?.empresa_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    })); // Cast explícito para evitar errores de TypeScript
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.empresa_id) {
      setMessage({ type: 'error', text: 'Usuario no autenticado' });
      return;
    }

    setSaving(true);
    try {
      // Crear objeto de actualización por separado
      const updateData: any = {
        nombre: formData.nombre,
        nit: formData.nit,
        telefono: formData.telefono,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
        mensaje_ticket: formData.mensaje_ticket,
        logo_url: formData.logo_url
      };
      
      const { error } = await supabase
        .from('empresas')
        // @ts-ignore - Ignorar error de TypeScript para este llamado
        .update(updateData as any)
        .eq('id', user.empresa_id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      await cargarEmpresa(); // Recargar datos
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando configuración...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Empresa</h1>
          <p className="text-gray-600 mt-2">
            Actualiza la información de tu empresa que aparecerá en los tickets y documentos.
          </p>
        </div>

        {/* Mensajes de Feedback */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="space-y-8">
          {/* Sección 1: Datos de Identidad (Editables) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Datos de Identidad del Negocio</h2>
              </div>
              <p className="text-gray-600 text-sm">
                Actualiza la información que aparecerá en los tickets y documentos.
              </p>
            </CardHeader>
            <CardContent>
              <form id="empresa-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre de la Empresa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="BeautyPro"
                      required
                    />
                  </div>

                  {/* NIT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIT / Cédula
                    </label>
                    <input
                      type="text"
                      name="nit"
                      value={formData.nit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="900-123-456-7"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(601) 234-5678"
                      />
                    </div>
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Quibdó"
                    />
                  </div>
                </div>

                {/* Dirección (ancho completo) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Calle Principal #123"
                    />
                  </div>
                </div>

                {/* Mensaje del Ticket (ancho completo) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje para Ticket
                  </label>
                  <div className="relative">
                    <DocumentTextIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="mensaje_ticket"
                      value={formData.mensaje_ticket}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="¡Gracias por su compra!&#10;No se aceptan devoluciones después de 24h"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Este mensaje aparecerá en el pie del ticket de venta.
                  </p>
                </div>

                {/* Logo (ancho completo) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo de la Empresa (Opcional)
                  </label>
                  <div className="space-y-4">
                    {/* Input de archivo */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleLogoChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {logoError && (
                          <p className="text-red-500 text-sm mt-1">{logoError}</p>
                        )}
                      </div>
                      
                      {/* Botón eliminar logo */}
                      {logoPreview && (
                        <Button
                          variant="outline"
                          onClick={handleEliminarLogo}
                          className="px-4 py-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Eliminar Logo
                        </Button>
                      )}
                    </div>
                    
                    {/* Previsualización del logo */}
                    {logoPreview && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">Logo cargado correctamente</p>
                          <p className="text-xs">Formato: {logoFile?.type}</p>
                          <p className="text-xs">Tamaño: {logoFile ? (logoFile.size / 1024).toFixed(1) : '0'} KB</p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-blue-500">**</span>
                      <span>Formatos permitidos: JPG, PNG, WebP. Tamaño máximo: 500 KB</span>
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sección 2: Estado de Suscripción (SOLO LECTURA) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCardIcon className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold">Estado de Suscripción</h2>
                <LockClosedIcon className="w-5 h-5 text-gray-400" title="Solo lectura" />
              </div>
              <p className="text-gray-600 text-sm">
                Información de tu suscripción. Para cambios contacta a soporte.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan Actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Actual
                  </label>
                  <div className="relative">
                    <CreditCardIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value="Plan Profesional"
                      disabled
                      readOnly
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Fecha de Inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value="01/01/2024"
                      disabled
                      readOnly
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Fecha de Vencimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value="31/12/2024"
                      disabled
                      readOnly
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <LockClosedIcon className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Los datos de suscripción son de solo lectura. Para cambiar tu plan o renovar, 
                    contacta a nuestro equipo de soporte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => cargarEmpresa()}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="empresa-form"
              variant="primary"
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Actualizar Configuración
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
