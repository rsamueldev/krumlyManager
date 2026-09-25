import React, { useEffect, useMemo } from 'react';
import { useTasaCambio } from '../context/TasaCambioContext';
import { useData } from '../context/DataContext';
import { Cookie, ShoppingCart, Receipt } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { tasaCambioBs, convertirUSDToVES } = useTasaCambio();
  const { ventas, cargandoVentas, obtenerVentas } = useData();

  useEffect(() => {
    obtenerVentas();
  }, [obtenerVentas]);

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

      {/* Historial de Ventas Recientes en Base de Datos */}
      <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-krumly-border pb-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-krumly-red" />
            <h3 className="font-heading font-bold text-base text-krumly-chocolate">Historial de Ventas en Tiempo Real</h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {ventas.length} {ventas.length === 1 ? 'venta registrada' : 'ventas registradas'}
          </span>
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
