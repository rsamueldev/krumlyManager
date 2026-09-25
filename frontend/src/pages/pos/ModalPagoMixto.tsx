import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CartItem } from './PosPage';
import { createVentaApi, VentaPagoPayload } from '../../services/ventasService';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { useData } from '../../context/DataContext';
import {
  X,
  DollarSign,
  Smartphone,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Scale,
} from 'lucide-react';

interface ModalPagoMixtoProps {
  cart: CartItem[];
  clienteNombre: string;
  onClose: () => void;
  onVentaCompletada: (codigoVenta: string, total: number) => void;
}

export type MetodoPagoTipoBackend = 'efectivo_usd' | 'efectivo_ves' | 'pago_movil' | 'punto_venta' | 'transferencia';

interface FilaPago {
  metodo: MetodoPagoTipoBackend;
  montoUsd: number;
  montoVes: number;
  referencia: string;
}

export const ModalPagoMixto: React.FC<ModalPagoMixtoProps> = ({
  cart,
  clienteNombre,
  onClose,
  onVentaCompletada,
}) => {
  const { tasaCambioBs } = useTasaCambio();
  const { refrescarProductos, refrescarVentas } = useData();

  // Total de la Venta en USD
  const totalUSD = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.producto.precioVenta * item.cantidad, 0);
  }, [cart]);

  const totalVES = useMemo(() => {
    return totalUSD * tasaCambioBs;
  }, [totalUSD, tasaCambioBs]);

  // Lista de Métodos de Pago cargados en este cobro
  const [pagos, setPagos] = useState<FilaPago[]>([
    {
      metodo: 'efectivo_usd',
      montoUsd: Number(totalUSD.toFixed(2)),
      montoVes: 0,
      referencia: '',
    },
  ]);

  const [procesando, setProcesando] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Cálculos del Balance de Pago
  const totalCubiertoUSD = useMemo(() => {
    return pagos.reduce((sum, p) => {
      if (p.metodo === 'efectivo_usd') {
        return sum + (p.montoUsd || 0);
      } else {
        const equivalenteUsd = (p.montoVes || 0) / (tasaCambioBs > 0 ? tasaCambioBs : 1);
        return sum + (p.montoUsd || equivalenteUsd);
      }
    }, 0);
  }, [pagos, tasaCambioBs]);

  const restanteUSD = useMemo(() => {
    const diff = totalUSD - totalCubiertoUSD;
    return diff > 0.009 ? diff : 0;
  }, [totalUSD, totalCubiertoUSD]);

  const vueltoUSD = useMemo(() => {
    const diff = totalCubiertoUSD - totalUSD;
    return diff > 0.009 ? diff : 0;
  }, [totalUSD, totalCubiertoUSD]);

  const vueltoVES = useMemo(() => {
    return vueltoUSD * tasaCambioBs;
  }, [vueltoUSD, tasaCambioBs]);

  const cobroCompleto = totalCubiertoUSD >= totalUSD - 0.01;

  // Handlers para la tabla de pagos
  const agregarMetodoPago = (metodo: MetodoPagoTipoBackend) => {
    const montoPendienteUSD = Number(restanteUSD.toFixed(2));
    const montoPendienteVES = Number((montoPendienteUSD * tasaCambioBs).toFixed(2));

    if (metodo === 'efectivo_usd') {
      setPagos([...pagos, { metodo, montoUsd: montoPendienteUSD, montoVes: 0, referencia: '' }]);
    } else {
      setPagos([
        ...pagos,
        { metodo, montoUsd: montoPendienteUSD, montoVes: montoPendienteVES, referencia: '' },
      ]);
    }
  };

  const actualizarPago = (index: number, campo: keyof FilaPago, valor: any) => {
    setPagos((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [campo]: valor };

      if (campo === 'montoVes' && item.metodo !== 'efectivo_usd') {
        item.montoUsd = Number((Number(valor) / (tasaCambioBs || 1)).toFixed(2));
      } else if (campo === 'montoUsd' && item.metodo !== 'efectivo_usd') {
        item.montoVes = Number((Number(valor) * tasaCambioBs).toFixed(2));
      }

      copy[index] = item;
      return copy;
    });
  };

  const eliminarPago = (index: number) => {
    if (pagos.length === 1) return;
    setPagos(pagos.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleProcesarVenta = async () => {
    if (!cobroCompleto) {
      setErrorText('El cobro debe cubrir el 100% del total de la venta.');
      return;
    }

    setProcesando(true);
    setErrorText(null);

    try {
      const detallesPayload = cart.map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
        precioUnitario: item.producto.precioVenta,
      }));

      const pagosPayload: VentaPagoPayload[] = pagos.map((p) => ({
        metodoPago: p.metodo,
        montoUsd: Number(p.montoUsd.toFixed(2)),
        montoVes: p.montoVes > 0 ? Number(p.montoVes.toFixed(2)) : undefined,
        tasaCambio: tasaCambioBs,
        referenciaPago: p.referencia.trim() || undefined,
      }));

      const response = await createVentaApi({
        clienteId: undefined, // Público general
        totalVenta: Number(totalUSD.toFixed(2)),
        detalles: detallesPayload,
        pagos: pagosPayload,
      });

      // Refrescar caché global de productos y ventas en DataContext para actualizar stock y KPIs
      await Promise.all([refrescarProductos(), refrescarVentas()]);

      onVentaCompletada(response.codigoVenta, response.totalVenta);
    } catch (err: any) {
      setErrorText(err.message || 'Error al procesar la venta en la base de datos');
    } finally {
      setProcesando(false);
    }
  };

  const getMetodoIcon = (m: MetodoPagoTipoBackend) => {
    switch (m) {
      case 'efectivo_usd':
      case 'efectivo_ves':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'pago_movil':
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case 'punto_venta':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'transferencia':
        return <Building2 className="w-4 h-4 text-amber-600" />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-krumly-border animate-in fade-in zoom-in-95 duration-150 space-y-5 max-h-[92vh] overflow-y-auto my-auto">
        
        {/* Header Modal */}
        <div className="flex justify-between items-start border-b border-krumly-border pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-krumly-red/10 border border-krumly-red/20 flex items-center justify-center text-krumly-red shrink-0 shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-krumly-chocolate leading-tight">
                Cobro y Procesamiento de Venta
              </h3>
              <p className="text-xs text-gray-500 font-medium leading-tight">
                Cliente: <strong className="text-krumly-chocolate">{clienteNombre}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerta de Error */}
        {errorText && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-150 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Tarjeta Resumen Total Venta */}
        <div className="bg-[#FFF9F5] border border-krumly-border/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
              Total del Pedido
            </span>
            <div className="font-heading font-extrabold text-2xl text-krumly-chocolate">
              ${totalUSD.toFixed(2)} <span className="text-xs font-bold text-gray-400">USD</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
              Tasa Oficial (BCV)
            </span>
            <span className="font-bold text-xs text-krumly-chocolate block">
              {tasaCambioBs.toFixed(2)} Bs / USD
            </span>
            <span className="text-xs font-bold text-krumly-red">
              ({totalVES.toFixed(2)} VES)
            </span>
          </div>
        </div>

        {/* Desglose de Formas de Pago */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
              Desglose de Pagos Recibidos
            </h4>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => agregarMetodoPago('pago_movil')}
                className="px-2.5 py-1 bg-krumly-cream/60 hover:bg-krumly-cream text-krumly-chocolate border border-krumly-border rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3 h-3 text-krumly-red stroke-[3]" />
                <span>Pago Móvil</span>
              </button>
              <button
                type="button"
                onClick={() => agregarMetodoPago('punto_venta')}
                className="px-2.5 py-1 bg-krumly-cream/60 hover:bg-krumly-cream text-krumly-chocolate border border-krumly-border rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3 h-3 text-krumly-red stroke-[3]" />
                <span>Punto</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {pagos.map((pago, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-krumly-border rounded-2xl space-y-2 shadow-2xs"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {getMetodoIcon(pago.metodo)}
                    <select
                      value={pago.metodo}
                      onChange={(e) =>
                        actualizarPago(idx, 'metodo', e.target.value as MetodoPagoTipoBackend)
                      }
                      className="bg-transparent font-bold text-xs text-krumly-chocolate focus:outline-none cursor-pointer"
                    >
                      <option value="efectivo_usd">Efectivo USD</option>
                      <option value="efectivo_ves">Efectivo Bolívares (VES)</option>
                      <option value="pago_movil">Pago Móvil</option>
                      <option value="punto_venta">Punto de Venta</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                    </select>
                  </div>

                  {pagos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarPago(idx)}
                      className="text-gray-300 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar este método de pago"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Campo USD o VES según método */}
                  {pago.metodo === 'efectivo_usd' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                        Monto Recibido ($ USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={pago.montoUsd}
                        onChange={(e) => actualizarPago(idx, 'montoUsd', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                        Monto Recibido (Bs. VES)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={pago.montoVes}
                        onChange={(e) => actualizarPago(idx, 'montoVes', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Referencia si no es efectivo */}
                  {pago.metodo !== 'efectivo_usd' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                        Nº Referencia / Lote
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 984512"
                        value={pago.referencia}
                        onChange={(e) => actualizarPago(idx, 'referencia', e.target.value)}
                        className="w-full px-3 py-1.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-end pb-1.5 text-[11px] font-medium text-gray-500">
                      Equivalente: ${(pago.montoUsd || 0).toFixed(2)} USD
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ficha Resumen de Balance & Vuelto */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-600">Total Cubierto:</span>
            <span className="font-extrabold text-krumly-chocolate">
              ${totalCubiertoUSD.toFixed(2)} USD
            </span>
          </div>

          {restanteUSD > 0 ? (
            <div className="flex justify-between items-center text-xs text-rose-700 font-bold border-t border-amber-200/60 pt-1.5">
              <span>Restante por cobrar:</span>
              <span>${restanteUSD.toFixed(2)} USD</span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-xs text-emerald-700 font-bold border-t border-amber-200/60 pt-1.5">
              <span>Vuelto / Cambio a Entregar:</span>
              <span>
                ${vueltoUSD.toFixed(2)} USD ({vueltoVES.toFixed(2)} Bs)
              </span>
            </div>
          )}
        </div>

        {/* Botón Final Confirmar Venta */}
        <button
          type="button"
          onClick={handleProcesarVenta}
          disabled={!cobroCompleto || procesando}
          className={`w-full font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer ${
            !cobroCompleto || procesando
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-krumly-red hover:bg-krumly-red-dark text-white shadow-krumly-red/20'
          }`}
        >
          {procesando ? (
            <span>Registrando Venta en Base de Datos...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar y Finalizar Venta</span>
            </>
          )}
        </button>
      </div>
    </div>,
    document.body
  );
};
