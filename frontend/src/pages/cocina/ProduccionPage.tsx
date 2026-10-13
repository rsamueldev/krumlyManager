import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import {
  fetchHistorialLotesApi,
  LoteProduccion,
  registrarLoteApi,
  simularProduccionApi,
  SimulacionProduccionResultado,
  simularHorneadoApi,
  SimularHorneadoResultado,
  hornearLoteApi,
} from '../../services/produccionService';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChefHat,
  Clock,
  Cookie,
  CookingPot,
  Flame,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
  X,
  Snowflake,
  ShoppingBag,
} from 'lucide-react';

export const ProduccionPage: React.FC = () => {
  const { productos, recetas, obtenerProductos, obtenerRecetas, refrescarInsumos, refrescarProductos } = useData();
  const { formatearUSD } = useTasaCambio();

  const [historialLotes, setHistorialLotes] = useState<LoteProduccion[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');

  // ── Modal 1: Amasado & Congelación (Materia Prima -> Freezer) ─────────────
  const [modalAmasadoAbierto, setModalAmasadoAbierto] = useState<boolean>(false);
  const [productoAmasadoId, setProductoAmasadoId] = useState<string>('');
  const [cantidadAmasar, setCantidadAmasar] = useState<number>(20);
  const [notasAmasado, setNotasAmasado] = useState<string>('');
  const [simulacionAmasado, setSimulacionAmasado] = useState<SimulacionProduccionResultado | null>(null);
  const [cargandoSimAmasado, setCargandoSimAmasado] = useState<boolean>(false);
  const [errorSimAmasado, setErrorSimAmasado] = useState<string | null>(null);
  const [procesandoAmasado, setProcesandoAmasado] = useState<boolean>(false);
  const [mensajeExitoAmasado, setMensajeExitoAmasado] = useState<string | null>(null);
  const [mensajeErrorAmasado, setMensajeErrorAmasado] = useState<string | null>(null);

  // ── Modal 2: Hornear & Empacar (Freezer -> Stock Venta / POS) ───────────────
  const [modalHorneadoAbierto, setModalHorneadoAbierto] = useState<boolean>(false);
  const [productoHorneadoId, setProductoHorneadoId] = useState<string>('');
  const [cantidadHornear, setCantidadHornear] = useState<number>(6);
  const [notasHorneado, setNotasHorneado] = useState<string>('');
  const [simulacionHorneado, setSimulacionHorneado] = useState<SimularHorneadoResultado | null>(null);
  const [cargandoSimHorneado, setCargandoSimHorneado] = useState<boolean>(false);
  const [errorSimHorneado, setErrorSimHorneado] = useState<string | null>(null);
  const [procesandoHorneado, setProcesandoHorneado] = useState<boolean>(false);
  const [mensajeExitoHorneado, setMensajeExitoHorneado] = useState<string | null>(null);
  const [mensajeErrorHorneado, setMensajeErrorHorneado] = useState<string | null>(null);

  // Carga inicial
  useEffect(() => {
    obtenerProductos();
    obtenerRecetas();
    cargarHistorial();
  }, [obtenerProductos, obtenerRecetas]);

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const data = await fetchHistorialLotesApi();
      setHistorialLotes(data);
    } catch (err) {
      console.error('Error al cargar historial de produccion:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Simulación en tiempo real: Amasado
  useEffect(() => {
    if (!productoAmasadoId || cantidadAmasar <= 0) {
      setSimulacionAmasado(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCargandoSimAmasado(true);
      setErrorSimAmasado(null);
      try {
        const sim = await simularProduccionApi(productoAmasadoId, cantidadAmasar);
        setSimulacionAmasado(sim);
      } catch (err: any) {
        setErrorSimAmasado(err.message || 'No se pudo realizar la simulación.');
        setSimulacionAmasado(null);
      } finally {
        setCargandoSimAmasado(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [productoAmasadoId, cantidadAmasar]);

  // Simulación en tiempo real: Horneado & Empaque
  useEffect(() => {
    if (!productoHorneadoId || cantidadHornear <= 0) {
      setSimulacionHorneado(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCargandoSimHorneado(true);
      setErrorSimHorneado(null);
      try {
        const sim = await simularHorneadoApi(productoHorneadoId, cantidadHornear);
        setSimulacionHorneado(sim);
      } catch (err: any) {
        setErrorSimHorneado(err.message || 'No se pudo realizar la simulación.');
        setSimulacionHorneado(null);
      } finally {
        setCargandoSimHorneado(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [productoHorneadoId, cantidadHornear]);

  // Abrir Modal Amasado
  const abrirModalAmasado = () => {
    setMensajeExitoAmasado(null);
    setMensajeErrorAmasado(null);
    // Solo productos individuales que tengan receta
    const prodConReceta = productos.find((p) => p.activo && !p.esCombo && p.recetaId);
    if (prodConReceta) {
      setProductoAmasadoId(prodConReceta.id);
    } else {
      const prodActivo = productos.find((p) => p.activo && !p.esCombo);
      setProductoAmasadoId(prodActivo ? prodActivo.id : '');
    }
    setCantidadAmasar(20);
    setNotasAmasado('');
    setModalAmasadoAbierto(true);
  };

  // Abrir Modal Horneado & Empaque
  const abrirModalHorneado = () => {
    setMensajeExitoHorneado(null);
    setMensajeErrorHorneado(null);
    // Pre-seleccionar un combo si hay, o un producto activo
    const combo = productos.find((p) => p.activo && p.esCombo);
    if (combo) {
      setProductoHorneadoId(combo.id);
    } else if (productos.length > 0) {
      setProductoHorneadoId(productos[0].id);
    }
    setCantidadHornear(6);
    setNotasHorneado('');
    setModalHorneadoAbierto(true);
  };

  // Submit Amasado
  const handleSubmitAmasado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoAmasadoId || cantidadAmasar <= 0) {
      setMensajeErrorAmasado('Selecciona un producto e ingresa una cantidad válida.');
      return;
    }

    if (simulacionAmasado && !simulacionAmasado.puedoProducir) {
      setMensajeErrorAmasado('Stock insuficiente de materia prima en cocina.');
      return;
    }

    setProcesandoAmasado(true);
    setMensajeErrorAmasado(null);

    try {
      await registrarLoteApi({
        productoId: productoAmasadoId,
        cantidadProducida: Number(cantidadAmasar),
        notas: notasAmasado.trim() || undefined,
      });

      setMensajeExitoAmasado(`¡Lote amasado y llevado al congelador! (+${cantidadAmasar} masas crudas).`);
      await Promise.all([refrescarInsumos(), refrescarProductos(), cargarHistorial()]);

      setTimeout(() => {
        setModalAmasadoAbierto(false);
        setMensajeExitoAmasado(null);
      }, 1500);
    } catch (err: any) {
      setMensajeErrorAmasado(err.message || 'Error al registrar lote de amasado.');
    } finally {
      setProcesandoAmasado(false);
    }
  };

  // Submit Horneado & Empaque
  const handleSubmitHorneado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoHorneadoId || cantidadHornear <= 0) {
      setMensajeErrorHorneado('Selecciona un producto/combo e ingresa una cantidad válida.');
      return;
    }

    if (simulacionHorneado && !simulacionHorneado.puedoHornear) {
      setMensajeErrorHorneado('Stock insuficiente en congelador o empaque.');
      return;
    }

    setProcesandoHorneado(true);
    setMensajeErrorHorneado(null);

    try {
      await hornearLoteApi({
        productoId: productoHorneadoId,
        cantidad: Number(cantidadHornear),
        notas: notasHorneado.trim() || undefined,
      });

      setMensajeExitoHorneado(`¡Cajas/galletas horneadas y empacadas! (+${cantidadHornear} listas en stock para la venta).`);
      await Promise.all([refrescarInsumos(), refrescarProductos(), cargarHistorial()]);

      setTimeout(() => {
        setModalHorneadoAbierto(false);
        setMensajeExitoHorneado(null);
      }, 1500);
    } catch (err: any) {
      setMensajeErrorHorneado(err.message || 'Error al registrar horneado.');
    } finally {
      setProcesandoHorneado(false);
    }
  };

  // Lotes filtrados para la tabla
  const lotesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return historialLotes;
    const term = busqueda.toLowerCase();
    return historialLotes.filter(
      (lote) =>
        (lote.producto?.nombre && lote.producto.nombre.toLowerCase().includes(term)) ||
        (lote.receta?.nombre && lote.receta.nombre.toLowerCase().includes(term)) ||
        (lote.usuario?.username && lote.usuario.username.toLowerCase().includes(term)) ||
        (lote.notas && lote.notas.toLowerCase().includes(term)),
    );
  }, [historialLotes, busqueda]);

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    const totalEnCongelador = productos.reduce((sum, p) => sum + (p.stockCongelador || 0), 0);
    const totalListasParaVenta = productos.reduce((sum, p) => sum + (p.stockActual || 0), 0);
    const totalLotes = historialLotes.length;

    return {
      totalEnCongelador,
      totalListasParaVenta,
      totalLotes,
    };
  }, [productos, historialLotes]);

  const productoAmasadoObj = useMemo(() => {
    return productos.find((p) => p.id === productoAmasadoId);
  }, [productos, productoAmasadoId]);

  const productoHorneadoObj = useMemo(() => {
    return productos.find((p) => p.id === productoHorneadoId);
  }, [productos, productoHorneadoId]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-krumly-red mb-1">
            <CookingPot className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Cocina, Horneado & Preparación</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-krumly-chocolate tracking-tight">
            Producción & Empaque
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Control de las 2 etapas operativas: <b>Amasado</b> hacia el congelador y <b>Horneado/Empaque</b> hacia inventario listo para venta (POS / Ferias).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={cargarHistorial}
            disabled={cargandoHistorial}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-krumly-chocolate rounded-xl text-xs font-semibold border border-krumly-border transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${cargandoHistorial ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {/* Botón 1: Amasado */}
          <button
            onClick={abrirModalAmasado}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Snowflake className="w-4 h-4" />
            <span>1. Amasar (Freezer)</span>
          </button>

          {/* Botón 2: Hornear & Empacar */}
          <button
            onClick={abrirModalHorneado}
            className="px-4 py-2 bg-krumly-red hover:bg-krumly-red-dark text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Flame className="w-4 h-4 stroke-[2.5]" />
            <span>2. Hornear & Empacar (Venta)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: The 3 stages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Etapa 1: Congelador */}
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
            <Snowflake className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">En Congelador</p>
            <p className="font-heading text-xl font-bold text-cyan-900 mt-0.5">
              {kpis.totalEnCongelador.toLocaleString()} masas
            </p>
            <p className="text-[11px] text-cyan-600 font-semibold">Crudas listas para hornear</p>
          </div>
        </div>

        {/* Etapa 2: Listas para Venta */}
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Listo para Venta</p>
            <p className="font-heading text-xl font-bold text-emerald-900 mt-0.5">
              {kpis.totalListasParaVenta.toLocaleString()} uds / cajas
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold">Listas para cobrar en POS</p>
          </div>
        </div>

        {/* Total Lotes */}
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <CookingPot className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Historial Total</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{kpis.totalLotes}</p>
            <p className="text-[11px] text-gray-400">Tandas registradas</p>
          </div>
        </div>
      </div>

      {/* Main Table: History */}
      <div className="bg-white rounded-2xl border border-krumly-border shadow-xs overflow-hidden">
        <div className="p-5 border-b border-krumly-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="font-heading text-lg font-bold text-krumly-chocolate flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Historial de Producción & Empaque</span>
            </h2>
            <p className="text-xs text-gray-500">Trazabilidad de amasados en congelador y lotes horneados para venta.</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por producto, notas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {cargandoHistorial ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <p className="text-xs">Cargando historial...</p>
            </div>
          ) : lotesFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <CookingPot className="w-12 h-12 text-gray-300" />
              <p className="font-medium text-gray-600 text-sm">No hay registros de producción todavía</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Amasa un lote para el congelador o procesa un horneado para llevar a la venta.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Tipo de Proceso</th>
                  <th className="py-3 px-4">Producto / Combo</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4">Operador</th>
                  <th className="py-3 px-4">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {lotesFiltrados.map((lote) => {
                  const esAmasado = lote.tipoLote !== 'horneado';
                  return (
                    <tr key={lote.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-medium">
                        {new Date(lote.fechaProduccion).toLocaleString('es-VE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {esAmasado ? (
                          <span className="inline-flex items-center space-x-1 bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <Snowflake className="w-3 h-3 text-cyan-600" />
                            <span>🥣 Amasado (Al Freezer)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-orange-50 text-orange-800 border border-orange-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <Flame className="w-3 h-3 text-orange-600" />
                            <span>🔥 Horneado & Empaque</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-krumly-chocolate">
                        {lote.producto?.nombre || 'Producto'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`px-2.5 py-0.5 rounded-full border ${esAmasado ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                          +{lote.cantidadProducida} uds
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {lote.usuario?.username || 'Sistema'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate">
                        {lote.notas || 'Sin notas'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ──────────────── MODAL 1: AMASADO Y CONGELACIÓN ──────────────── */}
      {modalAmasadoAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-krumly-border w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Header Fijo */}
            <div className="p-4 sm:p-5 border-b border-krumly-border flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-700 border border-cyan-200">
                  <Snowflake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base sm:text-lg font-bold text-krumly-chocolate">
                    Paso 1: Amasado & Congelación
                  </h3>
                  <p className="text-xs text-gray-500">Consume materia prima cruda y almacena masas formadas en el congelador.</p>
                </div>
              </div>
              <button
                onClick={() => setModalAmasadoAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario con Scroll Interno y Botones Fijos */}
            <form onSubmit={handleSubmitAmasado} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {mensajeExitoAmasado && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{mensajeExitoAmasado}</span>
                  </div>
                )}

                {mensajeErrorAmasado && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>{mensajeErrorAmasado}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Galleta a Amasar <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={productoAmasadoId}
                      onChange={(e) => setProductoAmasadoId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-krumly-chocolate outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    >
                      <option value="">-- Seleccionar Galleta --</option>
                      {productos
                        .filter((p) => p.activo && !p.esCombo)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} (En Freezer: {p.stockCongelador || 0})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Cantidad de Masas a Formar <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={cantidadAmasar}
                      onChange={(e) => setCantidadAmasar(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-krumly-chocolate outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Notas del Lote</label>
                    <input
                      type="text"
                      placeholder="Ej. Tanda de 30 unidades congeladas en bandeja #1"
                      value={notasAmasado}
                      onChange={(e) => setNotasAmasado(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Tarjeta de Verificación de Insumos (Responsive & Elegante) */}
                <div className="bg-cyan-50/40 border border-cyan-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-700 shrink-0" />
                      <h4 className="text-xs font-bold text-cyan-950 uppercase tracking-wider">
                        Consumo de Materia Prima Requerida
                      </h4>
                    </div>
                    {cargandoSimAmasado && (
                      <span className="text-[11px] font-semibold text-cyan-700 animate-pulse">
                        Calculando mezcla...
                      </span>
                    )}
                  </div>

                  {simulacionAmasado && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {simulacionAmasado.consumoInsumos.map((det) => (
                        <div
                          key={det.insumoId}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                            det.suficiente
                              ? 'bg-white border-cyan-200 shadow-2xs'
                              : 'bg-red-50/90 border-red-300 shadow-xs'
                          }`}
                        >
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-krumly-chocolate truncate">
                              {det.nombreInsumo}
                            </h5>
                            <p className="text-[10px] text-gray-500">
                              Usa: <strong className="text-krumly-chocolate">{det.cantidadRequerida.toFixed(1)} {det.unidadMedida}</strong> • Stock: {det.stockActual.toFixed(1)}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {det.suficiente ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Disponible</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                <span>Faltan {det.faltante} {det.unidadMedida}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Fijo con Botones Siempre Visibles */}
              <div className="p-3.5 sm:p-4 border-t border-krumly-border bg-gray-50/90 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalAmasadoAbierto(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoAmasado || !simulacionAmasado?.puedoProducir}
                  className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {procesandoAmasado ? <span>Amasando...</span> : <span>Confirmar Amasado (Al Freezer)</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 2: HORNEADO Y EMPAQUE (PARA LA VENTA) ──────────────── */}
      {modalHorneadoAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-krumly-border w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Header Fijo */}
            <div className="p-4 sm:p-5 border-b border-krumly-border flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 border border-orange-200">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base sm:text-lg font-bold text-krumly-chocolate">
                    Paso 2: Hornear & Empacar para Venta
                  </h3>
                  <p className="text-xs text-gray-500">Extrae masas del congelador, descuenta cajas/empaques y suma producto a stock de venta.</p>
                </div>
              </div>
              <button
                onClick={() => setModalHorneadoAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario con Scroll Interno y Botones Fijos */}
            <form onSubmit={handleSubmitHorneado} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {mensajeExitoHorneado && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{mensajeExitoHorneado}</span>
                  </div>
                )}

                {mensajeErrorHorneado && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>{mensajeErrorHorneado}</span>
                  </div>
                )}

                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>💡 ¿Cómo funcionan los combos (Double Krum / Triple Krum)?</strong> Solo debes hornear aquí tus galletas individuales hacia inventario de venta. En el <strong>Punto de Venta (POS)</strong> podrás armar las cajas al instante con cualquier combinación de sabores que pida el cliente (ej: 1 Pirulín + 1 Double Choco).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Galleta a Hornear para Venta <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={productoHorneadoId}
                      onChange={(e) => setProductoHorneadoId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-krumly-chocolate outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="">-- Seleccionar Galleta --</option>
                      <optgroup label="🍪 Galletas Individuales (Horneado Diario)">
                        {productos
                          .filter((p) => p.activo && !p.esCombo)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} (En Freezer: {p.stockCongelador || 0} | Listas: {p.stockActual})
                            </option>
                          ))}
                      </optgroup>
                      {productos.some((p) => p.activo && p.esCombo) && (
                        <optgroup label="🎁 Cajas / Combos Pre-Empacados (Fijos)">
                          {productos
                            .filter((p) => p.activo && p.esCombo)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} (Cajas listas: {p.stockActual})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Cantidad a Hornear <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={cantidadHornear}
                      onChange={(e) => setCantidadHornear(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-krumly-chocolate outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Notas u Ocasión</label>
                    <input
                      type="text"
                      placeholder="Ej. Tanda horneada para venta del día"
                      value={notasHorneado}
                      onChange={(e) => setNotasHorneado(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Tarjetas de Verificación: Masas de Congelador & Cajas de Empaque */}
                <div className="bg-orange-50/40 border border-orange-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
                      <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider">
                        Verificación de Masas & Empaque
                      </h4>
                    </div>
                    {cargandoSimHorneado && (
                      <span className="text-[11px] font-semibold text-orange-700 animate-pulse">
                        Comprobando disponibilidad...
                      </span>
                    )}
                  </div>

                  {simulacionHorneado && (
                    <div className="space-y-4">
                      {/* 1. Masas del Congelador */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                          <Snowflake className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>Masas a extraer del congelador:</span>
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {simulacionHorneado.consumoCongelador.map((c) => (
                            <div
                              key={c.productoId}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                                c.suficiente
                                  ? 'bg-white border-orange-200 shadow-2xs'
                                  : 'bg-red-50/90 border-red-300 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  c.suficiente ? 'bg-cyan-50 text-cyan-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  <Cookie className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                  <h5 className="font-bold text-xs text-krumly-chocolate truncate">
                                    {c.nombreProducto}
                                  </h5>
                                  <p className="text-[10px] text-gray-500">
                                    En freezer: <strong className={c.stockDisponible > 0 ? 'text-cyan-800' : 'text-gray-600'}>{c.stockDisponible} uds</strong>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                <div className="text-left sm:text-right">
                                  <span className="text-[10px] text-gray-400 block font-medium">Requeridas</span>
                                  <span className="text-xs font-extrabold text-krumly-chocolate">{c.cantidadRequerida} uds</span>
                                </div>

                                <div>
                                  {c.suficiente ? (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Disponible</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold">
                                      <AlertTriangle className="w-3 h-3 text-red-600" />
                                      <span>Faltan {c.faltante} en freezer</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. Cajas / Empaque */}
                      {simulacionHorneado.consumoEmpaque.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Empaque & Despacho a consumir:</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {simulacionHorneado.consumoEmpaque.map((e) => (
                              <div
                                key={e.insumoId}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                                  e.suficiente
                                    ? 'bg-white border-orange-200 shadow-2xs'
                                    : 'bg-red-50/90 border-red-300'
                                }`}
                              >
                                <div className="min-w-0">
                                  <h6 className="font-bold text-xs text-krumly-chocolate truncate">
                                    {e.nombreInsumo}
                                  </h6>
                                  <p className="text-[10px] text-gray-500">
                                    Usa: <strong className="text-krumly-chocolate">{e.cantidadRequerida} {e.unidadMedida}</strong> • Stock: {e.stockActual}
                                  </p>
                                </div>

                                <div className="shrink-0">
                                  {e.suficiente ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9.5px] font-bold">
                                      ✓ Ok
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-[9.5px] font-bold">
                                      Faltan {e.faltante}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Fijo con Botones Siempre Visibles */}
              <div className="p-3.5 sm:p-4 border-t border-krumly-border bg-gray-50/90 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalHorneadoAbierto(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoHorneado || !simulacionHorneado?.puedoHornear}
                  className="px-5 py-2.5 bg-krumly-red hover:bg-krumly-red-dark disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {procesandoHorneado ? <span>Preparando...</span> : <span>¡Confirmar y Dejar Listo para Venta!</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProduccionPage;
