import React, { useEffect, useMemo, useState } from 'react';
import { useTasaCambio } from '../context/TasaCambioContext';
import { useData } from '../context/DataContext';
import { ejecutarSincronizacionOffline } from '../services/offlineSyncService';
import { Cookie, ShoppingCart, Receipt, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { tasaCambioBs, convertirUSDToVES } = useTasaCambio();
  const { ventas, cargandoVentas, obtenerVentas, refrescarTodo } = useData();
  const [sincronizando, setSincronizando] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  useEffect(() => {
    obtenerVentas();
  }, [obtenerVentas]);

  const pendientesOfflineCount = useMemo(() => {
    return ventas.filter((v) => v.estadoSincronizacion === 'offline_pending').length;
  }, [ventas]);

  const handleSincronizarManual = async () => {
    setSincronizando(true);
    try {
      const count = await ejecutarSincronizacionOffline(true);
      await refrescarTodo();
      if (count > 0) {
        setNotificacion(`¡Se sincronizaron exitosamente ${count} venta(s) offline con la base de datos!`);
      } else {
        setNotificacion('No hay ventas offline pendientes por sincronizar.');
      }
    } catch (err: any) {
      setNotificacion(err.message || 'Error durante la sincronización de ventas offline');
    } finally {
      setSincronizando(false);
      setTimeout(() => setNotificacion(null), 6000);
    }
  };

  // Total acumulado de ventas registradas en BD
  const ventasUSD = useMemo(() => {
    return ventas.reduce((sum, v) => sum + Number(v.totalVenta || 0), 0);
  }, [ventas]);

  const egresosUSD = 0; // Se conectará en Sprint 4
  const utilidadUSD = ventasUSD - egresosUSD;

  return (
    <div className="space-y-6">
      {/* Resumen KPIs Top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ventas Totales ($)</p>
          <h3 className="font-heading text-2xl font-bold text-krumly-chocolate mt-1">${ventasUSD.toFixed(2)}</h3>
          <p className="text-xs font-semibold text-emerald-600 mt-1">
            {convertirUSDToVES(ventasUSD).toFixed(2)} Bs
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Egresos Totales ($)</p>
          <h3 className="font-heading text-2xl font-bold text-krumly-chocolate mt-1">${egresosUSD.toFixed(2)}</h3>
          <p className="text-xs font-semibold text-red-500 mt-1">
            {convertirUSDToVES(egresosUSD).toFixed(2)} Bs
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Utilidad Neta Real ($)</p>
          <h3 className="font-heading text-2xl font-bold text-emerald-600 mt-1">${utilidadUSD.toFixed(2)}</h3>
          <p className="text-xs font-semibold text-emerald-600 mt-1">
            {convertirUSDToVES(utilidadUSD).toFixed(2)} Bs
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tasa Activa del Día</p>
          <h3 className="font-heading text-2xl font-bold text-krumly-red mt-1">{tasaCambioBs.toFixed(2)} Bs</h3>
          <p className="text-[11px] text-gray-400 mt-1">Conversión en vivo activada</p>
        </div>
      </div>

      {/* Alerta / Notificación de Sincronización */}
      {notificacion && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center space-x-2 animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-xs">{notificacion}</span>
        </div>
      )}

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

      {/* Historial de Ventas Recientes en Base de Datos */}
      <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-krumly-border pb-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-krumly-red" />
            <h3 className="font-heading font-bold text-base text-krumly-chocolate">Historial de Ventas en Tiempo Real</h3>
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
            <span className="text-xs text-gray-500 font-medium">
              {ventas.length} {ventas.length === 1 ? 'venta registrada' : 'ventas registradas'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {cargandoVentas ? (
            <p className="py-6 text-center text-xs text-gray-400">Cargando historial de ventas...</p>
          ) : ventas.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 space-y-1">
              <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto" />
              <p>Aún no hay ventas registradas en la base de datos.</p>
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
                  <th className="py-3 px-4">Métodos de Pago</th>
                  <th className="py-3 px-4 text-right">Total ($ USD)</th>
                  <th className="py-3 px-4 text-right">Total (Bs. VES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-krumly-border/60">
                {ventas.map((v) => {
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
                      <td className="py-3 px-4 font-bold text-krumly-red">{v.codigoVenta}</td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-gray-500">{fechaStr}</td>
                      <td className="py-3 px-4 font-bold">{v.cliente?.nombre || 'Público General'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(v.pagos || []).map((p: any, pIdx: number) => (
                            <span
                              key={pIdx}
                              className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100/70 text-amber-900 capitalize border border-amber-200/50"
                            >
                              {p.metodoPago?.replace('_', ' ')} (${Number(p.montoUsd).toFixed(2)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-xs text-krumly-chocolate">
                        ${Number(v.totalVenta).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-xs text-gray-600">
                        {totalVes.toFixed(2)} Bs
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
