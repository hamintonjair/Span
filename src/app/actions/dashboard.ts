'use server';

import { createClient } from '@/lib/supabase/server';

export async function getDashboardKPIs(empresaId: string) {
  const supabase = createClient();

  try {
    // 1. Ventas del día
    const hoy = new Date().toISOString().split('T')[0];
    const { data: ventasHoy, error: errorVentas } = await supabase
      .from('ventas')
      .select('total')
      .eq('empresa_id', empresaId)
      .eq('created_at::date', hoy);
    
    const totalVentasHoy = ventasHoy?.reduce((sum, v) => sum + Number(v.total), 0) || 0;

    // 2. Citas pendientes
    const { data: citas, error: errorCitas } = await supabase
      .from('citas')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('estado', 'pendiente')
      .gte('fecha', new Date().toISOString());
    
    const citasPendientes = citas?.length || 0;

    // 3. Saldo de caja actual
    const { data: caja, error: errorCaja } = await supabase
      .from('cajas')
      .select('base_inicial, monto_final')
      .eq('empresa_id', empresaId)
      .eq('estado', 'abierta')
      .single();
    
    const saldoCaja = caja?.monto_final || caja?.base_inicial || 0;

    // 4. Total préstamos activos
    const { data: prestamos, error: errorPrestamos } = await supabase
      .from('prestamos')
      .select('saldo_pendiente')
      .eq('empresa_id', empresaId)
      .eq('estado', 'activo');
    
    const totalPrestamos = prestamos?.reduce((sum, p) => sum + Number(p.saldo_pendiente), 0) || 0;

    return {
      ventasHoy: totalVentasHoy,
      citasPendientes,
      saldoCaja,
      totalPrestamos,
      prestamosActivos: prestamos?.length || 0
    };

  } catch (error) {
    console.error('Error en KPIs:', error);
    return {
      ventasHoy: 0,
      citasPendientes: 0,
      saldoCaja: 0,
      totalPrestamos: 0,
      prestamosActivos: 0
    };
  }
}

export async function getInventarioBajoStock(empresaId: string) {
  const supabase = createClient();

  try {
    const { data: productos, error } = await supabase
      .from('productos')
      .select('id, nombre, stock, precio_venta')
      .eq('empresa_id', empresaId)
      .lt('stock', 5)
      .eq('estado', 'activo')
      .order('stock', { ascending: true })
      .limit(10);

    return productos || [];
  } catch (error) {
    console.error('Error en inventario:', error);
    return [];
  }
}

export async function getVentasSemana(empresaId: string) {
  const supabase = createClient();

  try {
    const semanaPasada = new Date();
    semanaPasada.setDate(semanaPasada.getDate() - 7);
    
    const { data: ventas, error } = await supabase
      .from('ventas')
      .select('total, created_at')
      .eq('empresa_id', empresaId)
      .gte('created_at', semanaPasada.toISOString())
      .order('created_at', { ascending: true });

    if (!ventas) return [];

    // Agrupar por día
    const ventasPorDia = Array.from({ length: 7 }, (_, i) => {
      const dia = new Date();
      dia.setDate(dia.getDate() - (6 - i));
      const diaStr = dia.toLocaleDateString('es', { weekday: 'short' });
      
      const ventasDia = ventas.filter(v => 
        new Date(v.created_at).toDateString() === dia.toDateString()
      ).reduce((sum, v) => sum + Number(v.total), 0);
      
      return { dia: diaStr, monto: ventasDia };
    });

    return ventasPorDia;
  } catch (error) {
    console.error('Error en ventas semana:', error);
    return [];
  }
}
