import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTasaCambio } from '../context/TasaCambioContext';
import {
  createGastoApi,
  deleteGastoApi,
  fetchGastosApi,
  Gasto,
  TipoGasto,
} from '../services/gastosService';
import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  User,
  Wallet,
  X,
} from 'lucide-react';

const METODOS_PAGO_PRESET = [
  { value: 'efectivo_usd', label: 'Efectivo USD ($)' },
  { value: 'efectivo_ves', label: 'Efectivo Bolívares (Bs)' },
  { value: 'pago_movil', label: 'Pago Móvil (Bs)' },
  { value: 'punto_venta', label: 'Punto de Venta (Bs)' },
  { value: 'transferencia', label: 'Transferencia Bancaria' },
];

export const GastosPage: React.FC = () => {
  const { categorias, obtenerCategorias } = useData();
  const { tasaCambioBs, convertirUSDToVES, formatearUSD, formatearBS } = useTasaCambio();

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'fijo' | 'variable'>('todos');

  // Modal State
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [tipoGasto, setTipoGasto] = useState<TipoGasto>('fijo');
  const [concepto, setConcepto] = useState<string>('');
  const [montoUsd, setMontoUsd] = useState<number>(10);
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('efectivo_usd');
  const [fechaGasto, setFechaGasto] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Feedback state
  const [guardando, setGuardando] = useState<boolean>(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    obtenerCategorias();
    cargarGastos();
  }, [obtenerCategorias]);

  const cargarGastos = async () => {
    setCargando(true);
    try {
      const data = await fetchGastosApi();
      setGastos(data);
    } catch (err) {
      console.error('Error al cargar historial de gastos:', err);
    } finally {
      setCargando(false);
    }
  };

  const categoriasGastos = useMemo(() => {
    return categorias.filter((c) => c.tipo === 'gasto');
  }, [categorias]);

  const montoVesCalculado = useMemo(() => {
    return convertirUSDToVES(montoUsd || 0);
  }, [montoUsd, convertirUSDToVES]);

  const abrirModalNuevo = () => {
    setErrorModal(null);
    setNotificacion(null);
    setConcepto('');
    setTipoGasto('fijo');
    setMontoUsd(10);
    setMetodoPago('efectivo_usd');
    setFechaGasto(new Date().toISOString().slice(0, 10));

    if (categoriasGastos.length > 0) {
      setCategoriaId(categoriasGastos[0].id);
    } else {
      setCategoriaId('');
    }
    setModalAbierto(true);
  };

  const handleSubmitGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim()) {
      setErrorModal('El concepto del gasto es obligatorio.');
      return;
    }
    if (montoUsd <= 0) {
      setErrorModal('El monto en USD debe ser mayor a cero.');
      return;
    }

    setGuardando(true);
    setErrorModal(null);
    setNotificacion(null);

    try {
      const nuevo = await createGastoApi({
        tipoGasto,
        concepto: concepto.trim(),
        montoUsd: Number(montoUsd),
        montoVes: montoVesCalculado,
        tasaCambio: tasaCambioBs,
        metodoPago,
        fechaGasto,
        categoriaId: categoriaId || undefined,
      });

      // Agregar al inicio de la lista local sin re-fetch
      setGastos((prev) => [nuevo, ...prev]);
      setNotificacion('¡Gasto registrado con éxito!');
      setModalAbierto(false);
      setTimeout(() => setNotificacion(null), 3000);
    } catch (err: any) {
      setErrorModal(err.message || 'Error al guardar el gasto.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarGasto = async (id: string, conceptoGasto: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro del gasto "${conceptoGasto}"?`)) return;

    try {
      await deleteGastoApi(id);
      setGastos((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el gasto.');
    }
  };

  // Gastos filtrados
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const cumpleFiltroTipo = filtroTipo === 'todos' ? true : g.tipoGasto === filtroTipo;
      const term = busqueda.toLowerCase();
      const cumpleBusqueda =
        !term ||
        g.concepto.toLowerCase().includes(term) ||
        (g.categoria?.nombre && g.categoria.nombre.toLowerCase().includes(term)) ||
        (g.usuario?.username && g.usuario.username.toLowerCase().includes(term));

      return cumpleFiltroTipo && cumpleBusqueda;
    });
  }, [gastos, filtroTipo, busqueda]);

  // KPIs de Gastos
  const kpis = useMemo(() => {
    const totalUsd = gastos.reduce((sum, g) => sum + (g.montoUsd || 0), 0);
    const totalFijos = gastos.filter((g) => g.tipoGasto === 'fijo').reduce((sum, g) => sum + (g.montoUsd || 0), 0);
    const totalVariables = gastos.filter((g) => g.tipoGasto === 'variable').reduce((sum, g) => sum + (g.montoUsd || 0), 0);

    return {
      totalUsd,
      totalFijos,
      totalVariables,
      totalRegistros: gastos.length,
    };
  }, [gastos]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-krumly-red mb-1">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Control Operativo & Egresos</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-krumly-chocolate tracking-tight">
            Registro de Gastos Operativos
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Gestiona los egresos fijos (alquiler, nómina, servicios) y variables (mantenimiento, transporte, empaques) en USD y VES con conversión según la tasa oficial del día.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={cargarGastos}
            disabled={cargando}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-krumly-chocolate rounded-xl text-xs font-semibold border border-krumly-border transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${cargando ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={abrirModalNuevo}
            className="px-4 py-2 bg-krumly-red hover:bg-krumly-red-dark text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos Totales</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{formatearUSD(kpis.totalUsd)}</p>
            <p className="text-[11px] text-red-700 font-semibold">{formatearBS(kpis.totalUsd)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos Fijos</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{formatearUSD(kpis.totalFijos)}</p>
            <p className="text-[11px] text-gray-400">Alquiler, Nómina, Luz, Agua</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos Variables</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{formatearUSD(kpis.totalVariables)}</p>
            <p className="text-[11px] text-gray-400">Mantenimiento, Transporte</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Egresos Registrados</p>
            <p className="font-heading text-xl font-bold text-krumly-chocolate mt-0.5">{kpis.totalRegistros}</p>
            <p className="text-[11px] text-purple-600 font-semibold">Total de facturas / recibos</p>
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
              <span>Historial de Gastos Operativos</span>
            </h2>
            <p className="text-xs text-gray-500">Consulta y clasifica los egresos de tu repostería en tiempo real.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Filter Pills */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFiltroTipo('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filtroTipo === 'todos' ? 'bg-white text-krumly-chocolate shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('fijo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filtroTipo === 'fijo' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Fijos
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('variable')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filtroTipo === 'variable' ? 'bg-white text-amber-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Variables
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar concepto o categoría..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-krumly-red focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-krumly-red" />
              <p className="text-xs">Cargando historial de gastos...</p>
            </div>
          ) : gastosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <CreditCard className="w-12 h-12 text-gray-300" />
              <p className="font-medium text-gray-600 text-sm">No se encontraron registros de gastos</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Haz clic en "Registrar Gasto" para registrar egresos fijos o variables y mantener un control contable exacto.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Concepto del Gasto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Tipo de Gasto</th>
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4 text-right">Monto ($ USD)</th>
                  <th className="py-3 px-4 text-right">Monto (Bs VES)</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {gastosFiltrados.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-medium">
                      {new Date(gasto.fechaGasto).toLocaleDateString('es-VE', {
                        dateStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-krumly-chocolate">
                      {gasto.concepto}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {gasto.categoria ? (
                        <span className="flex items-center space-x-1">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          <span>{gasto.categoria.nombre}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Sin categoría</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {gasto.tipoGasto === 'fijo' ? (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Gasto Fijo
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Gasto Variable
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 capitalize">
                      {gasto.metodoPago
                        ? METODOS_PAGO_PRESET.find((m) => m.value === gasto.metodoPago)?.label || gasto.metodoPago
                        : 'Efectivo USD'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-krumly-chocolate">
                      {formatearUSD(gasto.montoUsd)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500 font-semibold">
                      {gasto.montoVes ? `Bs. ${Number(gasto.montoVes).toFixed(2)}` : formatearBS(gasto.montoUsd)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleEliminarGasto(gasto.id, gasto.concepto)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE REGISTRO DE GASTO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-krumly-border w-full max-w-lg overflow-hidden my-8 transform transition-all">
            {/* Modal Header */}
            <div className="p-5 border-b border-krumly-border flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-krumly-cream rounded-xl text-krumly-red border border-krumly-border">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-krumly-chocolate">
                    Registrar Gasto Operativo
                  </h3>
                  <p className="text-xs text-gray-500">Ingresa los datos del egreso en USD o VES.</p>
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
            <form onSubmit={handleSubmitGasto} className="p-6 space-y-4">
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

              {/* Tipo de Gasto Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tipo de Gasto <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoGasto('fijo')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      tipoGasto === 'fijo'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Gasto Fijo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoGasto('variable')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      tipoGasto === 'variable'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Gasto Variable</span>
                  </button>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Concepto del Gasto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pago de alquiler de local o Servicio de Internet"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red outline-none"
                  required
                />
              </div>

              {/* Categoría & Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Categoría de Gasto</label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red outline-none"
                  >
                    <option value="">-- Seleccionar Categoría --</option>
                    {categoriasGastos.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha del Gasto</label>
                  <input
                    type="date"
                    value={fechaGasto}
                    onChange={(e) => setFechaGasto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red outline-none"
                  />
                </div>
              </div>

              {/* Montos USD & VES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Monto ($ USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={montoUsd}
                    onChange={(e) => setMontoUsd(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-extrabold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Monto Calculado (Bs. VES)
                  </label>
                  <input
                    type="text"
                    value={`Bs. ${montoVesCalculado.toFixed(2)}`}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red outline-none"
                >
                  {METODOS_PAGO_PRESET.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

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
                  disabled={guardando || !concepto.trim() || montoUsd <= 0}
                  className="px-5 py-2.5 bg-krumly-red hover:bg-krumly-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando Gasto...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Guardar Gasto</span>
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

export default GastosPage;
