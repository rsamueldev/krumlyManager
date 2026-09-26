import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import {
  fetchMermasApi,
  Merma,
  registrarMermaApi,
} from '../../services/mermasService';
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  User,
  X,
} from 'lucide-react';

const MOTIVOS_PRESET = [
  'Quemado / Mal Horneado',
  'Vencimiento de Producto',
  'Caída / Daño Físico',
  'Muestra / Degustación Comercial',
  'Error de Preparación',
  'Otro',
];

export const MermasPage: React.FC = () => {
  const { productos, obtenerProductos, refrescarProductos } = useData();
  const { formatearUSD, formatearBS } = useTasaCambio();

  const [mermas, setMermas] = useState<Merma[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');

  // Modal State
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [productoIdSeleccionado, setProductoIdSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState<string>(MOTIVOS_PRESET[0]);
  const [motivoPersonalizado, setMotivoPersonalizado] = useState<string>('');

  // State feedback
  const [guardando, setGuardando] = useState<boolean>(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    obtenerProductos();
    cargarMermas();
  }, [obtenerProductos]);

  const cargarMermas = async () => {
    setCargandoHistorial(true);
    try {
      const data = await fetchMermasApi();
      setMermas(data);
    } catch (err) {
      console.error('Error al cargar historial de mermas:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const abrirModalNuevo = () => {
    setErrorModal(null);
    setNotificacion(null);
    setCantidad(1);
    setMotivo(MOTIVOS_PRESET[0]);
    setMotivoPersonalizado('');

    const prodActivo = productos.find((p) => p.activo && p.stockActual > 0) || productos[0];
    if (prodActivo) {
      setProductoIdSeleccionado(prodActivo.id);
    }
    setModalAbierto(true);
  };

  const productoSeleccionadoObj = useMemo(() => {
    return productos.find((p) => p.id === productoIdSeleccionado);
  }, [productos, productoIdSeleccionado]);

  const costoPerdidaEstimado = useMemo(() => {
    if (!productoSeleccionadoObj || cantidad <= 0) return 0;
    const costoUnit = Number(productoSeleccionadoObj.costoDirectoTotal) || 0;
    return cantidad * costoUnit;
  }, [productoSeleccionadoObj, cantidad]);

  const handleSubmitMerma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoIdSeleccionado) {
      setErrorModal('Por favor selecciona un producto.');
      return;
    }

    if (cantidad <= 0) {
      setErrorModal('La cantidad a descartar debe ser mayor a 0.');
      return;
    }

    if (productoSeleccionadoObj && cantidad > productoSeleccionadoObj.stockActual) {
      setErrorModal(`No puedes descartar ${cantidad} unidades. Stock disponible: ${productoSeleccionadoObj.stockActual} unidades.`);
      return;
    }

    const motivoFinal = motivo === 'Otro' ? motivoPersonalizado.trim() : motivo;
    if (!motivoFinal) {
      setErrorModal('Por favor especifica un motivo válido para la merma.');
      return;
    }

    setGuardando(true);
    setErrorModal(null);
    setNotificacion(null);

    try {
      await registrarMermaApi({
        productoId: productoIdSeleccionado,
        cantidad: Number(cantidad),
        motivo: motivoFinal,
      });

      setNotificacion('¡Merma registrada exitosamente! Stock de producto actualizado.');

      await Promise.all([refrescarProductos(), cargarMermas()]);

      setTimeout(() => {
        setModalAbierto(false);
        setNotificacion(null);
      }, 1500);
    } catch (err: any) {
      setErrorModal(err.message || 'Error al registrar el descarte de producto.');
    } finally {
      setGuardando(false);
    }
  };

  // Mermas filtradas
  const mermasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return mermas;
    const term = busqueda.toLowerCase();
    return mermas.filter(
      (m) =>
        (m.producto?.nombre && m.producto.nombre.toLowerCase().includes(term)) ||
        m.motivo.toLowerCase().includes(term) ||
        (m.usuario?.username && m.usuario.username.toLowerCase().includes(term)),
    );
  }, [mermas, busqueda]);

  // KPIs
  const kpis = useMemo(() => {
    const totalUnidades = mermas.reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const costoTotalPerdida = mermas.reduce((sum, m) => {
      const costoUnit = m.producto?.costoDirectoTotal || 0;
      return sum + m.cantidad * costoUnit;
    }, 0);

    return {
      totalRegistros: mermas.length,
      totalUnidades,
      costoTotalPerdida,
    };
  }, [mermas]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-krumly-red mb-1">
            <Trash2 className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Inventario & Control de Calidad</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-krumly-chocolate tracking-tight">
            Registro de Mermas y Descartes
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Registra pérdidas de productos por quema, vencimiento, caídas o muestras comerciales. Descuenta unidades de inventario y cuantifica el costo de pérdida.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={cargarMermas}
            disabled={cargandoHistorial}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-krumly-chocolate rounded-xl text-xs font-semibold border border-krumly-border transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${cargandoHistorial ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={abrirModalNuevo}
            className="px-4 py-2 bg-krumly-red hover:bg-krumly-red-dark text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Merma</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades Descartadas</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{kpis.totalUnidades.toLocaleString()} uds</p>
            <p className="text-[11px] text-gray-400">Pérdida física acumulada</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Total Pérdidas</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{formatearUSD(kpis.costoTotalPerdida)}</p>
            <p className="text-[11px] text-amber-700 font-semibold">{formatearBS(kpis.costoTotalPerdida)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Registros de Merma</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{kpis.totalRegistros}</p>
            <p className="text-[11px] text-blue-600 font-semibold">Eventos registrados</p>
          </div>
        </div>
      </div>

      {/* Main Content Card: History Table */}
      <div className="bg-white rounded-2xl border border-krumly-border shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-krumly-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="font-heading text-lg font-bold text-krumly-chocolate flex items-center space-x-2">
              <Clock className="w-5 h-5 text-krumly-red" />
              <span>Historial de Mermas y Descartes</span>
            </h2>
            <p className="text-xs text-gray-500">Listado histórico de pérdidas con cuantificación de costos e impacto en inventario.</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por producto, motivo o usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-krumly-red focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {cargandoHistorial ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-krumly-red" />
              <p className="text-xs">Cargando registros de mermas...</p>
            </div>
          ) : mermasFiltradas.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <Trash2 className="w-12 h-12 text-gray-300" />
              <p className="font-medium text-gray-600 text-sm">No se encontraron registros de mermas</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Haz clic en "Registrar Merma" para reportar algún descarte de producto y descontar automáticamente del stock.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Producto Descartado</th>
                  <th className="py-3 px-4 text-center">Cant. Descartada</th>
                  <th className="py-3 px-4">Motivo / Causa</th>
                  <th className="py-3 px-4 text-right">Costo Pérdida ($)</th>
                  <th className="py-3 px-4">Registrado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {mermasFiltradas.map((item) => {
                  const costoUnit = item.producto?.costoDirectoTotal || 0;
                  const costoPerdidaTotal = item.cantidad * costoUnit;

                  return (
                    <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-medium">
                        {new Date(item.fechaMerma).toLocaleString('es-VE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-krumly-chocolate">
                        {item.producto?.nombre || 'Producto N/A'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-red-700">
                        <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full">
                          -{item.cantidad} uds
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {item.motivo}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        <span className="text-red-800">{formatearUSD(costoPerdidaTotal)}</span>
                        <div className="text-[10px] text-gray-400">{formatearBS(costoPerdidaTotal)}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.usuario ? (
                          <span className="flex items-center space-x-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{item.usuario.username}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Sistema</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE REGISTRO DE MERMA */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-krumly-border w-full max-w-lg overflow-hidden my-8 transform transition-all">
            {/* Modal Header */}
            <div className="p-5 border-b border-krumly-border flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-krumly-cream rounded-xl text-krumly-red border border-krumly-border">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-krumly-chocolate">
                    Registrar Merma o Descarte
                  </h3>
                  <p className="text-xs text-gray-500">Reporta pérdidas y descuenta unidades del inventario.</p>
                </div>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitMerma} className="p-6 space-y-4">
              {/* Notifications */}
              {notificacion && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start space-x-3 animate-slide-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{notificacion}</span>
                </div>
              )}

              {errorModal && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-start space-x-3 animate-slide-in">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorModal}</span>
                </div>
              )}

              {/* Producto */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Producto a Descartar <span className="text-red-500">*</span>
                </label>
                <select
                  value={productoIdSeleccionado}
                  onChange={(e) => setProductoIdSeleccionado(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red outline-none"
                  required
                >
                  <option value="">-- Seleccionar Producto --</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock disponible: {p.stockActual} uds)
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Cantidad a Descartar (unidades) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red outline-none"
                  required
                />
              </div>

              {/* Motivo Preset */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Motivo / Causa del Descarte <span className="text-red-500">*</span>
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red outline-none"
                  required
                >
                  {MOTIVOS_PRESET.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {motivo === 'Otro' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Especifique el Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej. Falla eléctrica en el horno"
                    value={motivoPersonalizado}
                    onChange={(e) => setMotivoPersonalizado(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs focus:ring-2 focus:ring-krumly-red outline-none"
                    required
                  />
                </div>
              )}

              {/* Loss Summary Box */}
              {productoSeleccionadoObj && (
                <div className="bg-red-50/70 p-3.5 rounded-xl border border-red-200 space-y-1 text-xs text-red-950">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Stock actual en inventario:</span>
                    <span className="font-bold text-krumly-chocolate">{productoSeleccionadoObj.stockActual} uds</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-red-200/80 pt-1">
                    <span className="font-bold text-red-900">Costo Estimado de Pérdida:</span>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-red-700">{formatearUSD(costoPerdidaEstimado)}</span>
                      <span className="text-[10px] text-gray-500 block">({formatearBS(costoPerdidaEstimado)})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando || !productoIdSeleccionado || cantidad <= 0}
                  className="px-5 py-2.5 bg-krumly-red hover:bg-krumly-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando Descarte...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirmar Descarte</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MermasPage;
