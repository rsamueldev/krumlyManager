import React from 'react';
import { useTasaCambio } from '../context/TasaCambioContext';
import { Cookie, CreditCard, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { tasaCambioBs, convertirUSDToVES } = useTasaCambio();

  // Todos los valores dinámicos inician en 0 hasta registrar operaciones reales en DB
  const ventasUSD = 0;
  const egresosUSD = 0;
  const utilidadUSD = 0;

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

      {/* Banner Informativo */}
      <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-bold text-krumly-chocolate">¡Bienvenido a Krumly Manager!</h3>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            El sistema de gestión y control operativo está activo. Usa la barra lateral para navegar a Cocina, Productos o Inventario.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-krumly-cream text-krumly-red flex items-center justify-center">
          <Cookie className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
};
