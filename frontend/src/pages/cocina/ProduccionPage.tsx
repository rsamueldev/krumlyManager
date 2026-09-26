import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import {
  fetchHistorialLotesApi,
  LoteProduccion,
  registrarLoteApi,
  simularProduccionApi,
  SimulacionProduccionResultado,
} from '../../services/produccionService';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChefHat,
  Clock,
  CookingPot,
  Flame,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react';

export const ProduccionPage: React.FC = () => {
  const { productos, recetas, obtenerProductos, obtenerRecetas, refrescarInsumos, refrescarProductos } = useData();
  const { formatearUSD, formatearBS } = useTasaCambio();

  const [historialLotes, setHistorialLotes] = useState<LoteProduccion[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');

  // Modal registrar lote state
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [productoIdSeleccionado, setProductoIdSeleccionado] = useState<string>('');
  const [cantidadAProducir, setCantidadAProducir] = useState<number>(10);
  const [notas, setNotas] = useState<string>('');

  // Simulacion state
  const [simulacion, setSimulacion] = useState<SimulacionProduccionResultado | null>(null);
  const [cargandoSimulacion, setCargandoSimulacion] = useState<boolean>(false);
  const [errorSimulacion, setErrorSimulacion] = useState<string | null>(null);

  // Form submission state
  const [procesandoLote, setProcesandoLote] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeErrorForm, setMensajeErrorForm] = useState<string | null>(null);

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

  // Simulación en tiempo real cada vez que cambia producto o cantidad
  useEffect(() => {
    if (!productoIdSeleccionado || cantidadAProducir <= 0) {
      setSimulacion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCargandoSimulacion(true);
      setErrorSimulacion(null);
      try {
        const sim = await simularProduccionApi(productoIdSeleccionado, cantidadAProducir);
        setSimulacion(sim);
      } catch (err: any) {
        setErrorSimulacion(err.message || 'No se pudo realizar la simulación de producción.');
        setSimulacion(null);
      } finally {
        setCargandoSimulacion(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [productoIdSeleccionado, cantidadAProducir]);

  const abrirModalNuevoLote = () => {
    setModalAbierto(true);
    setMensajeExito(null);
    setMensajeErrorForm(null);

    // Pre-seleccionar el primer producto activo
    const prodActivo = productos.find((p) => p.activo);
    if (prodActivo) {
      setProductoIdSeleccionado(prodActivo.id);
    } else if (productos.length > 0) {
      setProductoIdSeleccionado(productos[0].id);
    }
  };

  const handleSubmitLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoIdSeleccionado || cantidadAProducir <= 0) {
      setMensajeErrorForm('Por favor selecciona un producto e ingresa una cantidad mayor a 0.');
      return;
    }

    if (simulacion && !simulacion.puedoProducir) {
      setMensajeErrorForm('No es posible registrar el lote debido a stock insuficiente de materia prima.');
      return;
    }

    setProcesandoLote(true);
    setMensajeErrorForm(null);
    setMensajeExito(null);

    try {
      const nuevoLote = await registrarLoteApi({
        productoId: productoIdSeleccionado,
        cantidadProducida: Number(cantidadAProducir),
        notas: notas.trim() || undefined,
      });

      setMensajeExito(`¡Lote de preparación registrado con éxito! Insumos descontados y stock actualizado.`);

      // Actualizar datos globales y refrescar historial
      await Promise.all([refrescarInsumos(), refrescarProductos(), cargarHistorial()]);

      // Cerrar modal tras breve retraso
      setTimeout(() => {
        setModalAbierto(false);
        setMensajeExito(null);
      }, 1500);
    } catch (err: any) {
      setMensajeErrorForm(err.message || 'Error al registrar el lote de producción.');
    } finally {
      setProcesandoLote(false);
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

  // Cálculos de KPIs de producción
  const kpis = useMemo(() => {
    const totalLotes = historialLotes.length;
    const totalUnidades = historialLotes.reduce((sum, l) => sum + (l.cantidadProducida || 0), 0);

    return {
      totalLotes,
      totalUnidades,
    };
  }, [historialLotes]);

  const productoSeleccionadoObj = useMemo(() => {
    return productos.find((p) => p.id === productoIdSeleccionado);
  }, [productos, productoIdSeleccionado]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header Banner (Matching clean app style) */}
      <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-krumly-red mb-1">
            <CookingPot className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Gestión de Cocina & Preparación</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-krumly-chocolate tracking-tight">
            Lotes de Producción
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Simula el consumo de materia prima y registra la preparación de lotes (masas congeladas / listas) descontando insumos en tiempo real.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={cargarHistorial}
            disabled={cargandoHistorial}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-krumly-chocolate rounded-xl text-xs font-semibold border border-krumly-border transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${cargandoHistorial ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={abrirModalNuevoLote}
            className="px-4 py-2 bg-krumly-red hover:bg-krumly-red-dark text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Lote</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <CookingPot className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lotes Preparados</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{kpis.totalLotes}</p>
            <p className="text-[11px] text-gray-400">Total acumulado</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades Preparadas</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{kpis.totalUnidades.toLocaleString()} uds</p>
            <p className="text-[11px] text-gray-400">Sumatoria de lotes</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recetas Activas</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{recetas.length}</p>
            <p className="text-[11px] text-emerald-600 font-semibold">Fórmulas registradas</p>
          </div>
        </div>
      </div>

      {/* Main Content Card: History Table */}
      <div className="bg-white rounded-2xl border border-krumly-border shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-krumly-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="font-heading text-lg font-bold text-krumly-chocolate flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Historial de Lotes Preparados</span>
            </h2>
            <p className="text-xs text-gray-500">Registro detallado de lotes de producción con trazabilidad e insumos descontados.</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por producto, receta u operador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {cargandoHistorial ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <p className="text-xs">Cargando historial de lotes de producción...</p>
            </div>
          ) : lotesFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <CookingPot className="w-12 h-12 text-gray-300" />
              <p className="font-medium text-gray-600 text-sm">No se encontraron lotes de producción</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Haz clic en "Registrar Lote" para procesar tu primera preparación y actualizar automáticamente el inventario.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Producto Preparado</th>
                  <th className="py-3 px-4">Receta Usada</th>
                  <th className="py-3 px-4 text-center">Unidades Preparadas</th>
                  <th className="py-3 px-4">Registrado Por</th>
                  <th className="py-3 px-4">Notas / Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {lotesFiltrados.map((lote) => (
                  <tr key={lote.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-medium">
                      {new Date(lote.fechaProduccion).toLocaleString('es-VE', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-krumly-chocolate">
                      {lote.producto?.nombre || 'Producto N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <span className="flex items-center space-x-1">
                        <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                        <span>{lote.receta?.nombre || 'Receta base'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        +{lote.cantidadProducida} uds
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {lote.usuario ? (
                        <span className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{lote.usuario.username}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Sistema</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate">
                      {lote.notas || 'Sin observaciones'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE REGISTRO Y SIMULACIÓN DE LOTE */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-krumly-border w-full max-w-3xl overflow-hidden my-8 transform transition-all">
            {/* Modal Header */}
            <div className="p-5 border-b border-krumly-border flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-krumly-cream rounded-xl text-krumly-red border border-krumly-border">
                  <CookingPot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-krumly-chocolate">
                    Registrar Lote de Producción
                  </h3>
                  <p className="text-xs text-gray-500">Calcula la mezcla y deduce los insumos de inventario automáticamente.</p>
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
            <form onSubmit={handleSubmitLote} className="p-6 space-y-6">
              {/* Alert Messages */}
              {mensajeExito && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start space-x-3 animate-slide-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{mensajeExito}</span>
                </div>
              )}

              {mensajeErrorForm && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-start space-x-3 animate-slide-in">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{mensajeErrorForm}</span>
                </div>
              )}

              {/* Step 1: Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Producto */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Producto a Preparar <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={productoIdSeleccionado}
                    onChange={(e) => setProductoIdSeleccionado(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none font-semibold text-krumly-chocolate"
                    required
                  >
                    <option value="">-- Seleccionar Producto --</option>
                    {productos
                      .filter((p) => p.activo)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.recetaId ? `(Receta: ${p.receta?.nombre || 'Vinculada'})` : '(Sin receta vinculada)'}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Cantidad a Producir */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cantidad a Preparar (unidades) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={cantidadAProducir}
                    onChange={(e) => setCantidadAProducir(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none font-bold text-krumly-chocolate"
                    required
                  />
                </div>

                {/* Receta Info Box */}
                {productoSeleccionadoObj && (
                  <div className="md:col-span-2 bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs flex items-center justify-between text-amber-950">
                    <div>
                      <span className="font-bold">Masa por unidad:</span> {productoSeleccionadoObj.pesoMasaGramos}g |{' '}
                      <span className="font-bold">Masa total del lote:</span>{' '}
                      {(productoSeleccionadoObj.pesoMasaGramos * cantidadAProducir).toFixed(0)}g
                    </div>
                    {productoSeleccionadoObj.receta && (
                      <span className="bg-amber-200/70 text-amber-900 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        Receta: {productoSeleccionadoObj.receta.nombre}
                      </span>
                    )}
                  </div>
                )}

                {/* Notas */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Notas u Observaciones del Lote</label>
                  <input
                    type="text"
                    placeholder="Ej. Tanda preparada para congelación en bandejas de 50 uds."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Step 2: Live Real-Time Raw Material Simulation */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h4 className="font-heading text-xs font-bold text-krumly-chocolate uppercase tracking-wider">
                      Simulación de Consumo de Insumos en Tiempo Real
                    </h4>
                  </div>
                  {cargandoSimulacion && (
                    <span className="text-[11px] text-amber-700 font-semibold flex items-center space-x-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Calculando mezcla...</span>
                    </span>
                  )}
                </div>

                {errorSimulacion && (
                  <div className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs font-medium">
                    {errorSimulacion}
                  </div>
                )}

                {simulacion && (
                  <div className="space-y-3">
                    {/* Insumos Table */}
                    <div className="max-h-48 overflow-y-auto border border-amber-200 rounded-xl bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-amber-100/50 sticky top-0 text-[11px] font-bold text-amber-900 border-b border-amber-200">
                          <tr>
                            <th className="py-2 px-3">Insumo Requerido</th>
                            <th className="py-2 px-3 text-right">Cant. Requerida</th>
                            <th className="py-2 px-3 text-right">Stock Disponible</th>
                            <th className="py-2 px-3 text-center">Estado Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100 text-[11px]">
                          {simulacion.consumoInsumos.map((det) => (
                            <tr
                              key={det.insumoId}
                              className={!det.suficiente ? 'bg-red-50/80 text-red-900 font-semibold' : ''}
                            >
                              <td className="py-2 px-3 font-medium">{det.nombreInsumo}</td>
                              <td className="py-2 px-3 text-right font-mono">
                                {det.cantidadRequerida.toFixed(2)} {det.unidadMedida}
                              </td>
                              <td className="py-2 px-3 text-right font-mono">
                                {det.stockActual.toFixed(2)} {det.unidadMedida}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {det.suficiente ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    ✓ Suficiente
                                  </span>
                                ) : (
                                  <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                                    <AlertTriangle className="w-3 h-3 text-red-600" />
                                    <span>Insuficiente (Faltan {det.faltante} {det.unidadMedida})</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Stock Alert Warning Banner if Insufficient Stock */}
                    {!simulacion.puedoProducir && (
                      <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                        <div>
                          <p className="leading-tight">⚠️ Stock Insuficiente en Inventario</p>
                          <p className="text-[11px] font-normal text-red-700 mt-0.5">
                            No tienes suficiente materia prima para preparar este lote. Repón el inventario de los insumos marcados en rojo antes de proceder.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    procesandoLote ||
                    !productoIdSeleccionado ||
                    cantidadAProducir <= 0 ||
                    (simulacion !== null && !simulacion.puedoProducir)
                  }
                  className="px-5 py-2.5 bg-krumly-red hover:bg-krumly-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  {procesandoLote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando Lote...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirmar Lote & Descontar Stock</span>
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

export default ProduccionPage;
