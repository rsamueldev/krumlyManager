import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Producto } from '../../services/productosService';
import { useTasaCambio } from '../../context/TasaCambioContext';
import {
  clasificarGalleta,
  obtenerGalletasParaCombos,
  obtenerSlotsParaCombo,
  SlotComboConfig,
  TipoGalleta,
} from '../../utils/comboUtils';
import {
  X,
  Sparkles,
  Package,
  CheckCircle2,
  Cookie,
  AlertCircle,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

export interface GalletaComboSeleccionada {
  producto: Producto;
  slotNombre: string;
}

interface ModalPersonalizarComboProps {
  combo: Producto;
  todosProductos: Producto[];
  onClose: () => void;
  onConfirmar: (combo: Producto, galletas: GalletaComboSeleccionada[], cantidad: number) => void;
}

export const ModalPersonalizarCombo: React.FC<ModalPersonalizarComboProps> = ({
  combo,
  todosProductos,
  onClose,
  onConfirmar,
}) => {
  const { tasaCambioBs } = useTasaCambio();

  // Galletas disponibles para armar cajas
  const galletasDisponibles = useMemo(() => {
    return obtenerGalletasParaCombos(todosProductos);
  }, [todosProductos]);

  // Definición de ranuras requeridas para este combo
  const slotsConfig: SlotComboConfig[] = useMemo(() => {
    return obtenerSlotsParaCombo(combo);
  }, [combo]);

  // Selección activa por cada slot { [slotId]: Producto }
  const [seleccionPorSlot, setSeleccionPorSlot] = useState<Record<string, Producto>>({});
  const [cantidadCajas, setCantidadCajas] = useState<number>(1);

  // Inicializar selección por defecto con el primer producto disponible con stock
  useEffect(() => {
    const inicial: Record<string, Producto> = {};
    slotsConfig.forEach((slot) => {
      const opciones = galletasDisponibles.filter((g) => slot.filtro(g));
      // Priorizar la primera que tenga stock > 0
      const conStock = opciones.find((g) => (g.stockActual || 0) > 0) || opciones[0];
      if (conStock) {
        inicial[slot.id] = conStock;
      }
    });
    setSeleccionPorSlot(inicial);
  }, [slotsConfig, galletasDisponibles]);

  const seleccionarGalletaEnSlot = (slotId: string, galleta: Producto) => {
    setSeleccionPorSlot((prev) => ({
      ...prev,
      [slotId]: galleta,
    }));
  };

  // Validación: todos los slots deben tener una galleta seleccionada con stock suficiente
  const todosSlotsCompletos = useMemo(() => {
    return slotsConfig.every((slot) => {
      const g = seleccionPorSlot[slot.id];
      return Boolean(g && (g.stockActual || 0) >= cantidadCajas);
    });
  }, [slotsConfig, seleccionPorSlot, cantidadCajas]);

  const handleConfirmar = () => {
    if (!todosSlotsCompletos) return;

    const listaGalletas: GalletaComboSeleccionada[] = slotsConfig.map((slot) => ({
      producto: seleccionPorSlot[slot.id],
      slotNombre: slot.titulo,
    }));

    onConfirmar(combo, listaGalletas, cantidadCajas);
  };

  const badgeTipo = (tipo: TipoGalleta) => {
    switch (tipo) {
      case 'premium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            ✨ Premium
          </span>
        );
      case 'especial':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            🌟 Especial
          </span>
        );
      case 'clasica':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            🍪 Clásica
          </span>
        );
    }
  };

  const totalUSD = combo.precioVenta * cantidadCajas;
  const totalVES = totalUSD * tasaCambioBs;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-krumly-border w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header Fijo */}
        <div className="p-4 sm:p-5 border-b border-krumly-border flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-white to-amber-50/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                  Combo Personalizado
                </span>
                <span className="text-xs font-bold text-gray-500">
                  ${combo.precioVenta.toFixed(2)} c/u
                </span>
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-krumly-chocolate tracking-tight mt-0.5">
                {combo.nombre}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con Scroll Interno */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              El cliente elige los sabores al momento. Selecciona qué galletas incluirá esta caja para descontarlas de forma exacta del stock listo para venta.
            </p>
          </div>

          {/* Ranuras de selección */}
          <div className="space-y-5">
            {slotsConfig.map((slot) => {
              const galletasParaEsteSlot = galletasDisponibles.filter((g) => slot.filtro(g));
              const seleccionActual = seleccionPorSlot[slot.id];

              return (
                <div key={slot.id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading text-sm font-bold text-krumly-chocolate flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center mr-1">
                          {slot.numero}
                        </span>
                        <span>{slot.titulo}</span>
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{slot.subtitulo}</p>
                    </div>

                    {seleccionActual && (
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/70 hidden sm:inline-block">
                        Elegida: {seleccionActual.nombre}
                      </span>
                    )}
                  </div>

                  {/* Grid de opciones para este slot */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {galletasParaEsteSlot.map((galleta) => {
                      const esSeleccionada = seleccionActual?.id === galleta.id;
                      const stockVal = galleta.stockActual || 0;
                      const sinStock = stockVal < cantidadCajas;
                      const tipo = clasificarGalleta(galleta);

                      return (
                        <button
                          key={galleta.id}
                          type="button"
                          onClick={() => !sinStock && seleccionarGalletaEnSlot(slot.id, galleta)}
                          disabled={sinStock}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative cursor-pointer ${
                            esSeleccionada
                              ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-400/30 shadow-xs'
                              : sinStock
                              ? 'bg-gray-50/60 border-gray-200 opacity-50 cursor-not-allowed'
                              : 'bg-white border-krumly-border hover:border-purple-300 hover:bg-purple-50/20 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            {badgeTipo(tipo)}
                            {esSeleccionada && (
                              <div className="w-4.5 h-4.5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <h5 className="font-bold text-xs text-krumly-chocolate line-clamp-2 leading-tight">
                            {galleta.nombre}
                          </h5>

                          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10.5px]">
                            <span className="text-gray-400 font-medium">Stock:</span>
                            <span
                              className={`font-bold ${
                                sinStock ? 'text-red-500' : 'text-emerald-700'
                              }`}
                            >
                              {stockVal > 0 ? `${stockVal} uds` : 'Agotado'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen de la Combinación en Tiempo Real */}
          <div className="bg-gray-50 border border-krumly-border rounded-2xl p-4 space-y-2">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Contenido de la Caja ({cantidadCajas} {cantidadCajas === 1 ? 'unidad' : 'unidades'}):
            </h5>
            <div className="flex flex-wrap gap-2">
              {slotsConfig.map((slot) => {
                const g = seleccionPorSlot[slot.id];
                return (
                  <div
                    key={slot.id}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-semibold text-krumly-chocolate shadow-2xs"
                  >
                    <Cookie className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      {g ? g.nombre : <em className="text-gray-400">Sin seleccionar</em>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Fijo con Selector de Cantidad y Botón de Acción */}
        <div className="p-4 sm:p-5 border-t border-krumly-border bg-gray-50/90 flex flex-col sm:flex-row items-center justify-between gap-3.5 shrink-0">
          {/* Selector de Cantidad de Cajas */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs font-bold text-gray-600">Cantidad:</span>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-xl border border-krumly-border shadow-2xs">
              <button
                type="button"
                onClick={() => setCantidadCajas((c) => Math.max(1, c - 1))}
                disabled={cantidadCajas <= 1}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center text-krumly-chocolate font-bold transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-heading font-black text-sm text-krumly-chocolate px-2 min-w-6 text-center">
                {cantidadCajas}
              </span>
              <button
                type="button"
                onClick={() => setCantidadCajas((c) => c + 1)}
                className="w-7 h-7 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-right sm:text-left pl-2">
              <span className="font-heading font-black text-base text-krumly-chocolate block">
                ${totalUSD.toFixed(2)} USD
              </span>
              <span className="text-[11px] text-gray-500 font-medium block">
                {totalVES.toFixed(2)} Bs
              </span>
            </div>
          </div>

          {/* Botones Cancelar / Confirmar */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={!todosSlotsCompletos}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-40 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Agregar al Carrito</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
