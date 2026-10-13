import React, { useEffect, useMemo, useState } from 'react';
import { useTasaCambio } from '../context/TasaCambioContext';
import { useData } from '../context/DataContext';
import { fetchDashboardMetricsApi, DashboardMetrics } from '../services/dashboardService';
import { ejecutarSincronizacionOffline } from '../services/offlineSyncService';
import { deleteVentaApi } from '../services/ventasService';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Calendar,
  CheckCircle2,
  Cookie,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Loader2,
  Package,
  Receipt,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { tasaCambioBs, formatearUSD, formatearBS } = useTasaCambio();
  const { ventas, cargandoVentas, obtenerVentas, refrescarTodo, eliminarVentaLocal } = useData();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cargandoMetrics, setCargandoMetrics] = useState<boolean>(true);
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('hoy');

  const [sincronizando, setSincronizando] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [eliminandoVentaId, setEliminandoVentaId] = useState<string | null>(null);

  useEffect(() => {
    obtenerVentas();
    cargarMetricas(periodo);
  }, [obtenerVentas]);

  const cargarMetricas = async (nuevoPeriodo?: 'hoy' | 'semana' | 'mes' | 'todos') => {
    const p = nuevoPeriodo || periodo;
    setCargandoMetrics(true);
    try {
      const data = await fetchDashboardMetricsApi(p);
      setMetrics(data);
    } catch (err) {
      console.error('Error al cargar métricas del dashboard:', err);
    } finally {
      setCargandoMetrics(false);
    }
  };

  const handleCambiarPeriodo = (nuevo: 'hoy' | 'semana' | 'mes' | 'todos') => {
    setPeriodo(nuevo);
    cargarMetricas(nuevo);
  };

  const pendientesOfflineCount = useMemo(() => {
    return ventas.filter((v) => v.estadoSincronizacion === 'offline_pending').length;
  }, [ventas]);

  // Filtrado de ventas locales según el período seleccionado
  const ventasFiltradas = useMemo(() => {
    if (periodo === 'todos') return ventas;
    const ahora = new Date();

    if (periodo === 'hoy') {
      const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
      return ventas.filter((v) => new Date(v.fechaVenta) >= hoyInicio);
    }

    if (periodo === 'semana') {
      const inicioSemana = new Date(ahora);
      const diaSemana = ahora.getDay();
      const diff = ahora.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
      inicioSemana.setDate(diff);
      inicioSemana.setHours(0, 0, 0, 0);
      return ventas.filter((v) => new Date(v.fechaVenta) >= inicioSemana);
    }

    if (periodo === 'mes') {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);
      return ventas.filter((v) => new Date(v.fechaVenta) >= inicioMes);
    }

    return ventas;
  }, [ventas, periodo]);

  const periodoLabel = useMemo(() => {
    switch (periodo) {
      case 'hoy':
        return 'del Día de Hoy';
      case 'semana':
        return 'de Esta Semana';
      case 'mes':
        return 'de Este Mes';
      case 'todos':
        return 'del Historial Completo';
      default:
        return '';
    }
  }, [periodo]);

  const handleSincronizarManual = async () => {
    setSincronizando(true);
    try {
      const count = await ejecutarSincronizacionOffline(true);
      await Promise.all([refrescarTodo(), cargarMetricas()]);
      if (count > 0) {
        setNotificacion(`¡Se sincronizaron exitosamente ${count} venta(s) offline con la base de datos!`);
      } else {
        setNotificacion('No hay ventas offline pendientes por sincronizar.');
      }
    } catch (err: any) {
      setNotificacion(err.message || 'Error durante la sincronización de ventas offline');
    } finally {
      setSincronizando(false);
      setTimeout(() => setNotificacion(null), 5000);
    }
  };

  const handleEliminarVenta = async (venta: any) => {
    const ticket = venta.codigoVenta || 'esta venta';
    const esOffline = venta.estadoSincronizacion === 'offline_pending';

    const mensaje = esOffline
      ? `¿Estás seguro de descartar la venta offline "${ticket}"? Esta acción la eliminará de la cola pendiente.`
      : `¿Estás seguro de eliminar la venta "${ticket}"? Esta acción cancelará el registro y restaurará automáticamente el stock de los productos e insumos involucrados.`;

    if (!window.confirm(mensaje)) return;

    setEliminandoVentaId(venta.id);
    try {
      if (!esOffline) {
        await deleteVentaApi(venta.id);
      }
      eliminarVentaLocal(venta.id);
      cargarMetricas().catch(() => {});
      setNotificacion(`Venta "${ticket}" eliminada correctamente.`);
      setTimeout(() => setNotificacion(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la venta.');
    } finally {
      setEliminandoVentaId(null);
    }
  };

  // Fallback de cálculos de ventas
  const ventasUSD = useMemo(() => {
    return metrics
      ? metrics.totalVentasUsd
      : ventasFiltradas.reduce((sum, v) => sum + Number(v.totalVenta || 0), 0);
  }, [metrics, ventasFiltradas]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notificación */}
      {notificacion && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificacion}</span>
        </div>
      )}

      {/* Standard Header Banner with Period Switcher */}
      <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-krumly-red mb-1">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Panel de Control Financiero</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-krumly-chocolate tracking-tight">
            Consola Financiera y Desglose Operativo
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Monitoreo en tiempo real de ventas, qué productos se han vendido en el día o por períodos, punto de equilibrio y alertas de amasado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Period Selector Tabs */}
          <div className="bg-krumly-cream/60 p-1 rounded-xl border border-krumly-border flex items-center space-x-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleCambiarPeriodo('hoy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                periodo === 'hoy'
                  ? 'bg-krumly-red text-white shadow-xs'
                  : 'text-gray-600 hover:text-krumly-chocolate hover:bg-white/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Hoy</span>
            </button>

            <button
              type="button"
              onClick={() => handleCambiarPeriodo('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                periodo === 'semana'
                  ? 'bg-krumly-red text-white shadow-xs'
                  : 'text-gray-600 hover:text-krumly-chocolate hover:bg-white/60'
              }`}
            >
              <span>Esta Semana</span>
            </button>

            <button
              type="button"
              onClick={() => handleCambiarPeriodo('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                periodo === 'mes'
                  ? 'bg-krumly-red text-white shadow-xs'
                  : 'text-gray-600 hover:text-krumly-chocolate hover:bg-white/60'
              }`}
            >
              <span>Este Mes</span>
            </button>

            <button
              type="button"
              onClick={() => handleCambiarPeriodo('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                periodo === 'todos'
                  ? 'bg-krumly-red text-white shadow-xs'
                  : 'text-gray-600 hover:text-krumly-chocolate hover:bg-white/60'
              }`}
            >
              <span>Todo</span>
            </button>
          </div>

          <button
            onClick={() => cargarMetricas()}
            disabled={cargandoMetrics}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-krumly-chocolate rounded-xl text-xs font-semibold border border-krumly-border transition-all flex items-center space-x-2 cursor-pointer shadow-2xs"
            title="Refrescar métricas del período"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${cargandoMetrics ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <Link
            to="/pos"
            className="px-4 py-2 bg-krumly-red hover:bg-krumly-red-dark text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Punto de Venta (POS)</span>
          </Link>
        </div>
      </div>

      {/* Banner de Ventas Offline Pendientes */}
      {pendientesOfflineCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs font-bold">
              Tienes <strong>{pendientesOfflineCount}</strong> venta(s) guardadas localmente pendientes por enviar al servidor.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSincronizarManual}
            disabled={sincronizando}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
            <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
          </button>
        </div>
      )}

      {/* Resumen Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos / Ventas Totales */}
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Ventas {periodo === 'hoy' ? 'de Hoy' : periodo === 'semana' ? 'de la Semana' : periodo === 'mes' ? 'del Mes' : 'Totales'}
            </p>
            <h3 className="font-heading text-2xl font-bold text-krumly-chocolate mt-1">
              {formatearUSD(ventasUSD)}
            </h3>
            <p className="text-xs font-semibold text-emerald-600 mt-0.5">
              {formatearBS(ventasUSD)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Costo Galletas Vendidas (COGS) */}
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Costo Galletas (COGS)</p>
            <h3 className="font-heading text-2xl font-bold text-krumly-chocolate mt-1">
              {formatearUSD(metrics?.cogsUsd || 0)}
            </h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              {formatearBS(metrics?.cogsUsd || 0)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Cookie className="w-6 h-6" />
          </div>
        </div>

        {/* Gastos Operativos (Fijos + Variables) */}
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gastos Operativos</p>
            <h3 className="font-heading text-2xl font-bold text-krumly-chocolate mt-1">
              {formatearUSD(metrics?.gastosTotalesUsd || 0)}
            </h3>
            <p className="text-xs font-semibold text-amber-700 mt-0.5">
              Fijos: {formatearUSD(metrics?.gastosFijosUsd || 0)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Pérdidas por Mermas */}
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pérdidas por Mermas</p>
            <h3 className="font-heading text-2xl font-bold text-red-700 mt-1">
              {formatearUSD(metrics?.mermasTotalesUsd || 0)}
            </h3>
            <p className="text-xs font-semibold text-red-600 mt-0.5">
              {metrics?.cantidadMermas || 0} evento(s) reportados
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Detalle Operativo: ¿Qué se vendió en el período? */}
      <div className="bg-white rounded-2xl border border-krumly-border shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-krumly-border gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-krumly-red" />
              <h3 className="font-heading font-bold text-lg text-krumly-chocolate">
                ¿Qué se ha vendido {periodoLabel}?
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Desglose detallado por galleta y combo de las unidades despachadas y facturación generada.
            </p>
          </div>

          {/* Mini-KPI Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center space-x-1.5">
              <span>🍪 Total Unidades:</span>
              <span className="font-extrabold text-krumly-chocolate text-sm">
                {metrics?.totalUnidadesVendidas || 0}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center space-x-1.5">
              <span>🧾 Tickets:</span>
              <span className="font-extrabold text-purple-950 text-sm">
                {metrics?.cantidadVentas || metrics?.totalVentasRealizadas || 0}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-1.5">
              <span>🎯 Ticket Promedio:</span>
              <span className="font-extrabold text-emerald-950 text-sm">
                {formatearUSD(metrics?.ticketPromedioUsd || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Listado / Grid del Desglose de Productos */}
        {!metrics?.desgloseProductos || metrics.desgloseProductos.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 space-y-1 bg-gray-50/50 rounded-xl p-6 border border-dashed border-gray-200">
            <Cookie className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-600">No hay ventas registradas {periodoLabel}.</p>
            <p className="text-[11px] text-gray-400">
              Cuando despaches galletas o combos en el POS durante este período, verás aquí el desglose exacto de cada producto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {metrics.desgloseProductos.map((item) => {
              const porcentajeTotal =
                (metrics.totalUnidadesVendidas || 0) > 0
                  ? Math.round((item.cantidadVendida / metrics.totalUnidadesVendidas) * 100)
                  : 0;

              return (
                <div
                  key={item.productoId}
                  className={`p-4 rounded-xl border transition-all hover:shadow-sm flex flex-col justify-between ${
                    item.esCombo
                      ? 'bg-purple-50/40 border-purple-200'
                      : 'bg-[#FFFDFB] border-amber-200/70'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.esCombo
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.esCombo ? '🎁 COMBO / CAJA' : '🍪 GALLETA'}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500">
                        {porcentajeTotal}% del volumen
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-sm text-krumly-chocolate leading-snug line-clamp-2">
                      {item.nombre}
                    </h4>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Despachadas
                      </span>
                      <span className="font-heading font-extrabold text-base text-krumly-chocolate">
                        {item.cantidadVendida}{' '}
                        <span className="text-xs font-semibold text-gray-500">
                          {item.esCombo ? 'cajas' : 'galletas'}
                        </span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Ingresos
                      </span>
                      <span className="font-extrabold text-sm text-emerald-700 block">
                        {formatearUSD(item.totalVentasUsd)}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500">
                        {formatearBS(item.totalVentasUsd)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Break-Even Point Card & Utilidad Neta Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Punto de Equilibrio Progress Card (2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-r from-krumly-red via-krumly-red-dark to-[#5E0A0A] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-red-800/40">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-15 pointer-events-none">
            <Target className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-100">
                <Target className="w-5 h-5 text-red-200" />
                <span className="text-xs font-bold uppercase tracking-wider">Punto de Equilibrio (Break-Even)</span>
              </div>
              <span className="bg-white/15 text-white border border-white/20 text-xs font-bold px-3 py-1 rounded-full">
                Tasa del día: {(Number(tasaCambioBs) || 40.5).toFixed(2)} Bs/$
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <p className="text-xs text-red-100/80 font-medium">Meta de Cobertura de Costos y Gastos:</p>
                <h2 className="font-heading text-3xl font-extrabold text-white mt-0.5">
                  {formatearUSD(metrics?.puntoEquilibrioUsd || 0)}
                </h2>
                <p className="text-xs text-red-100/90 font-semibold">
                  {formatearBS(metrics?.puntoEquilibrioUsd || 0)}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs text-red-100/80 font-medium">Progreso Alcanzado:</p>
                <p className="font-heading text-3xl font-extrabold text-amber-300">
                  {metrics?.porcentajePuntoEquilibrioAlcanzado || 0}%
                </p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-black/30 rounded-full h-3.5 overflow-hidden p-0.5 border border-white/20">
                <div
                  className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out shadow-md"
                  style={{ width: `${Math.min(100, metrics?.porcentajePuntoEquilibrioAlcanzado || 0)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-red-100/90 font-medium">
                <span>Ventas del Período: {formatearUSD(ventasUSD)}</span>
                <span>Objetivo: {formatearUSD(metrics?.puntoEquilibrioUsd || 0)}</span>
              </div>
            </div>

            {/* Status explanation */}
            {(metrics?.porcentajePuntoEquilibrioAlcanzado || 0) >= 100 ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs font-semibold text-emerald-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  🎉 ¡Punto de Equilibrio alcanzado! A partir de este nivel, todas las ventas generan utilidad neta directa para el negocio.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-white/10 border border-white/20 rounded-xl text-xs font-medium text-white flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>
                  Faltan {formatearUSD(Math.max(0, (metrics?.puntoEquilibrioUsd || 0) - ventasUSD))} en ventas para cubrir el 100% de los costos fijos y variables del período.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Utilidad Neta Real Summary Card (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-krumly-border pb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Utilidad Neta Real</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  (metrics?.utilidadNetaUsd || 0) >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                Margen: {metrics?.margenNetoPorcentaje || 0}%
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-medium">Resultado Neto del Negocio:</p>
              <h2
                className={`font-heading text-3xl font-extrabold mt-1 ${
                  (metrics?.utilidadNetaUsd || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {formatearUSD(metrics?.utilidadNetaUsd || 0)}
              </h2>
              <p className="text-xs font-bold text-gray-500 mt-0.5">
                {formatearBS(metrics?.utilidadNetaUsd || 0)}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Utilidad Bruta (Ventas - COGS):</span>
                <span className="font-bold text-krumly-chocolate">{formatearUSD(metrics?.utilidadBrutaUsd || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>- Gastos Operativos:</span>
                <span className="font-semibold text-amber-800">-{formatearUSD(metrics?.gastosTotalesUsd || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>- Pérdidas por Mermas:</span>
                <span className="font-semibold text-red-700">-{formatearUSD(metrics?.mermasTotalesUsd || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Contenido Inferior: Top Productos + Alertas de Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Productos Más Vendidos (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-krumly-border shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-krumly-border pb-3">
            <div className="flex items-center space-x-2">
              <Cookie className="w-5 h-5 text-krumly-red" />
              <h3 className="font-heading font-bold text-base text-krumly-chocolate">Top 5 Productos Más Vendidos y Rentables</h3>
            </div>
            <Link to="/productos" className="text-xs font-bold text-krumly-red hover:underline flex items-center space-x-1">
              <span>Ver Catálogo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!metrics || !metrics.topProductos || metrics.topProductos.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 space-y-1">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto" />
              <p>Aún no hay suficientes ventas registradas para generar el ranking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3 text-center">Unidades Vendidas</th>
                    <th className="py-2.5 px-3 text-right">Ingreso Total ($)</th>
                    <th className="py-2.5 px-3 text-right">Ganancia Est. ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(metrics.topProductos || []).map((p, idx) => (
                    <tr key={p.productoId} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-3 font-bold text-krumly-chocolate flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span>{p.nombre}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-gray-700">
                        {p.cantidadVendida} uds
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-krumly-chocolate">
                        {formatearUSD(p.totalVentasUsd)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-700">
                        {formatearUSD(p.gananciaUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alertas de Stock Bajo (1 col) */}
        <div className="bg-white rounded-2xl border border-krumly-border shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-krumly-border pb-3">
            <div className="flex items-center space-x-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-heading font-bold text-base text-krumly-chocolate">Alertas de Stock Bajo</h3>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {metrics?.alertasStock?.length || 0} ítems
            </span>
          </div>

          {!metrics || !metrics.alertasStock || metrics.alertasStock.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-700 space-y-1 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold">¡Inventario en Niveles Óptimos!</p>
              <p className="text-[11px] text-emerald-600">No hay materia prima ni masas congeladas por debajo del stock mínimo.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {(metrics.alertasStock || []).map((item) => (
                <div
                  key={`${item.tipo}-${item.id}`}
                  className="p-3 bg-red-50/80 border border-red-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    {item.tipo === 'producto' ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Snowflake className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                        <Boxes className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-gray-950 block">{item.nombre}</span>
                      <span className="text-[10px] text-gray-600 font-medium">
                        {item.tipo === 'producto' ? 'Masas en Freezer (Alerta Amasado)' : `Materia Prima (${item.unidadMedida})`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-red-700 block">
                      {item.tipo === 'producto' ? (item.stockCongelador ?? item.stockActual) : item.stockActual} / Mín: {item.stockMinimo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.tipo === 'producto'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.tipo === 'producto' ? 'Amasar Lote' : 'Reponer'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historial de Ventas Recientes en Base de Datos */}
      <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-krumly-border pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-krumly-red" />
            <div>
              <h3 className="font-heading font-bold text-base text-krumly-chocolate">
                Historial de Ventas {periodoLabel}
              </h3>
              <p className="text-[11px] text-gray-400">
                Detalle en tiempo real de transacciones y galletas despachadas.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {pendientesOfflineCount > 0 && (
              <button
                type="button"
                onClick={handleSincronizarManual}
                disabled={sincronizando}
                className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${sincronizando ? 'animate-spin' : ''}`} />
                <span>Sincronizar ({pendientesOfflineCount})</span>
              </button>
            )}
            <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-lg">
              {ventasFiltradas.length} {ventasFiltradas.length === 1 ? 'venta' : 'ventas'} en este período
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {cargandoVentas ? (
            <p className="py-6 text-center text-xs text-gray-400">Cargando historial de ventas...</p>
          ) : ventasFiltradas.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 space-y-1">
              <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto" />
              <p>Aún no hay ventas registradas {periodoLabel}.</p>
              <p className="text-[11px] text-gray-400">Procesa una venta desde el Punto de Venta (POS) para verla aquí.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FFF9F5] border-b border-krumly-border text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Código / Ticket</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Productos Despachados</th>
                  <th className="py-3 px-4">Métodos de Pago</th>
                  <th className="py-3 px-4 text-right">Total ($ USD)</th>
                  <th className="py-3 px-4 text-right">Total (Bs. VES)</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-krumly-border/60">
                {ventasFiltradas.map((v) => {
                  const totalVes = Number(v.totalVenta || 0) * tasaCambioBs;
                  const fechaStr = new Date(v.fechaVenta).toLocaleString('es-VE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={v.id} className="hover:bg-amber-50/20 transition-colors font-medium text-krumly-chocolate">
                      <td className="py-3 px-4 font-bold text-krumly-red whitespace-nowrap">{v.codigoVenta}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {v.estadoSincronizacion === 'offline_pending' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Offline (Pendiente)</span>
                          </span>
                        ) : v.estadoSincronizacion === 'offline_synced' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center space-x-1">
                            <span>Offline (Sincronizada)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center space-x-1">
                            <span>Online</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{fechaStr}</td>
                      <td className="py-3 px-4 font-bold">{v.cliente?.nombre || 'Público General'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {v.detalles && v.detalles.length > 0 ? (
                            v.detalles.map((det: any, dIdx: number) => (
                              <span
                                key={dIdx}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-800 border border-gray-200"
                              >
                                <span className="font-bold text-krumly-red">{det.cantidad}x</span>
                                <span className="truncate max-w-[120px]">{det.producto?.nombre || 'Producto'}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Sin detalles</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(v.pagos || []).map((p: any, pIdx: number) => (
                            <span
                              key={pIdx}
                              className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100/70 text-amber-900 capitalize border border-amber-200/50 whitespace-nowrap"
                            >
                              {p.metodoPago?.replace('_', ' ')} (${Number(p.montoUsd).toFixed(2)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-xs text-krumly-chocolate whitespace-nowrap">
                        ${Number(v.totalVenta).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-xs text-gray-600 whitespace-nowrap">
                        {totalVes.toFixed(2)} Bs
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarVenta(v)}
                          disabled={eliminandoVentaId === v.id}
                          title="Eliminar venta y restaurar stock"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                        >
                          {eliminandoVentaId === v.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
