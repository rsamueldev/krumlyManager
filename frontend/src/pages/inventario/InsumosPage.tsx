import { createPortal } from 'react-dom';
import React, { useEffect, useMemo, useState } from 'react';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { useData } from '../../context/DataContext';
import {
  createInsumoApi,
  deleteInsumoApi,
  fetchInsumosApi,
  Insumo,
  updateInsumoApi,
} from '../../services/insumosService';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  Scale,
} from 'lucide-react';

export const InsumosPage: React.FC = () => {
  const { tasaCambioBs, convertirUSDToVES } = useTasaCambio();

  const { insumos, cargandoInsumos: cargando, obtenerInsumos, refrescarInsumos } = useData();
  const [busqueda, setBusqueda] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState<string>('todos');

  // Modal State
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoInsumoId, setEditandoInsumoId] = useState<string | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [unidadMedida, setUnidadMedida] = useState<'gramos' | 'ml' | 'unidades'>('gramos');
  const [cantidadEmpaque, setCantidadEmpaque] = useState<number>(1000);
  const [precioCompra, setPrecioCompra] = useState<number>(5);
  const [stockActual, setStockActual] = useState<number>(5000);
  const [stockMinimo, setStockMinimo] = useState<number>(500);

  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    obtenerInsumos();
  }, [obtenerInsumos]);

  const abrirModalNuevo = () => {
    setEditandoInsumoId(null);
    setNombre('');
    setUnidadMedida('gramos');
    setCantidadEmpaque(1000);
    setPrecioCompra(5.0);
    setStockActual(5000);
    setStockMinimo(500);
    setErrorModal(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (insumo: Insumo) => {
    setEditandoInsumoId(insumo.id);
    setNombre(insumo.nombre);
    setUnidadMedida(insumo.unidadMedida);
    setCantidadEmpaque(insumo.cantidadEmpaque);
    setPrecioCompra(insumo.precioCompra);
    setStockActual(insumo.stockActual);
    setStockMinimo(insumo.stockMinimo);
    setErrorModal(null);
    setModalAbierto(true);
  };

  // Cálculo derivado en tiempo real dentro del modal
  const costoUnitarioCalculado = useMemo(() => {
    if (cantidadEmpaque <= 0) return 0;
    return Number((precioCompra / cantidadEmpaque).toFixed(4));
  }, [precioCompra, cantidadEmpaque]);

  const handleGuardarInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModal(null);

    if (!nombre.trim()) {
      setErrorModal('El nombre del insumo es obligatorio.');
      return;
    }
    if (cantidadEmpaque <= 0) {
      setErrorModal('La cantidad por empaque debe ser mayor a 0.');
      return;
    }
    if (precioCompra < 0) {
      setErrorModal('El precio de compra no puede ser negativo.');
      return;
    }

    try {
      if (editandoInsumoId) {
        await updateInsumoApi(editandoInsumoId, {
          nombre: nombre.trim(),
          unidadMedida,
          cantidadEmpaque,
          precioCompra,
          costoUnitario: costoUnitarioCalculado,
          stockActual,
          stockMinimo,
        });
        await refrescarInsumos();
        setNotificacion('¡Insumo actualizado exitosamente!');
      } else {
        await createInsumoApi({
          nombre: nombre.trim(),
          unidadMedida,
          cantidadEmpaque,
          precioCompra,
          stockActual,
          stockMinimo,
        });
        await refrescarInsumos();
        setNotificacion('¡Insumo registrado en la base de datos exitosamente!');
      }
      setModalAbierto(false);
      setTimeout(() => setNotificacion(null), 3000);
    } catch (err: any) {
      setErrorModal(err.message || 'Error al guardar el insumo en el servidor');
    }
  };

  const handleEliminarInsumo = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este insumo del inventario?')) return;
    try {
      await deleteInsumoApi(id);
      await refrescarInsumos();
      setNotificacion('Insumo eliminado correctamente');
      setTimeout(() => setNotificacion(null), 3000);
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el insumo');
    }
  };

  // Filtrado de insumos
  const insumosFiltrados = useMemo(() => {
    return insumos.filter((i) => {
      const coincideNombre = i.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideUnidad = filtroUnidad === 'todos' || i.unidadMedida === filtroUnidad;
      return coincideNombre && coincideUnidad;
    });
  }, [insumos, busqueda, filtroUnidad]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-krumly-red mb-1">
            <Package className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Inventario & Materia Prima</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-krumly-chocolate tracking-tight">
            Insumos de Materia Prima
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Gestión de ingredientes y materias primas con cálculo automático de costo derivado por gramo/ml y control de stock mínimo.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => refrescarInsumos()}
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
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Alerta de Notificación */}
      {notificacion && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-2 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-xs">{notificacion}</span>
        </div>
      )}

      {/* Filtros & Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-krumly-border shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar materia prima..."
            className="w-full pl-10 pr-4 py-2 bg-krumly-cream/40 border border-krumly-border rounded-xl text-xs font-medium text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-bold text-gray-500">Filtrar:</span>
          <select
            value={filtroUnidad}
            onChange={(e) => setFiltroUnidad(e.target.value)}
            className="px-3 py-2 bg-krumly-cream/40 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
          >
            <option value="todos">Todas las Unidades</option>
            <option value="gramos">Gramos (g)</option>
            <option value="ml">Mililitros (ml)</option>
            <option value="unidades">Unidades</option>
          </select>
        </div>
      </div>

      {/* Tabla de Insumos */}
      <div className="bg-white rounded-2xl border border-krumly-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF9F5] border-b border-krumly-border text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Insumo</th>
                <th className="py-3 px-4">Unidad</th>
                <th className="py-3 px-4">Cant. Empaque</th>
                <th className="py-3 px-4">Precio Compra ($)</th>
                <th className="py-3 px-4">Costo Unitario Derivado</th>
                <th className="py-3 px-4">Stock Actual</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-krumly-border/60 text-xs">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                    Cargando insumos desde la base de datos...
                  </td>
                </tr>
              ) : insumosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                    No hay insumos registrados en la base de datos. Haz clic en "Nuevo Insumo" para registrar el primero.
                  </td>
                </tr>
              ) : (
                insumosFiltrados.map((insumo) => {
                  const esStockBajo = insumo.stockActual <= insumo.stockMinimo;
                  const unidadLabel = insumo.unidadMedida === 'gramos' ? 'g' : insumo.unidadMedida === 'ml' ? 'ml' : 'ud';

                  return (
                    <tr key={insumo.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-krumly-chocolate">
                        {insumo.nombre}
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-gray-600">
                        {insumo.unidadMedida}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {insumo.cantidadEmpaque.toLocaleString()} {unidadLabel}
                      </td>
                      <td className="py-3 px-4 font-bold text-krumly-chocolate">
                        ${insumo.precioCompra.toFixed(2)} USD
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-krumly-cream text-krumly-red font-bold text-xs">
                          ${insumo.costoUnitario.toFixed(4)} / {unidadLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            esStockBajo ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {insumo.stockActual.toLocaleString()} {unidadLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => abrirModalEditar(insumo)}
                            className="p-1.5 text-gray-400 hover:text-krumly-chocolate hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar insumo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarInsumo(insumo.id)}
                            className="p-1.5 text-gray-400 hover:text-krumly-red hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear / Editar Insumo */}
      {modalAbierto && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-krumly-border animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center border-b border-krumly-border pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-krumly-cream rounded-lg text-krumly-red">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-krumly-chocolate">
                  {editandoInsumoId ? 'Editar Insumo' : 'Nuevo Insumo de Materia Prima'}
                </h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorModal && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorModal}</span>
              </div>
            )}

            <form onSubmit={handleGuardarInsumo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Insumo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Harina de Trigo Todo Uso"
                  className="w-full px-3.5 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unidad de Medida</label>
                  <select
                    value={unidadMedida}
                    onChange={(e) => setUnidadMedida(e.target.value as any)}
                    className="w-full px-3 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                  >
                    <option value="gramos">Gramos (g)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="unidades">Unidades</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cantidad Empaque</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadEmpaque}
                    onChange={(e) => setCantidadEmpaque(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Precio de Compra ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                  required
                />
              </div>

              {/* Ficha Resumen Derivado */}
              <div className="bg-[#FFF9F5] p-3 rounded-xl border border-krumly-border flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Costo Unitario Derivado:</span>
                <span className="font-bold text-xs text-krumly-red bg-white px-2.5 py-1 rounded-lg border border-krumly-border">
                  ${costoUnitarioCalculado.toFixed(4)} / {unidadMedida === 'gramos' ? 'g' : unidadMedida === 'ml' ? 'ml' : 'ud'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={stockActual}
                    onChange={(e) => setStockActual(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    min="0"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-1/2 py-2.5 border border-krumly-border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-krumly-red hover:bg-krumly-red-dark text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  {editandoInsumoId ? 'Actualizar' : 'Guardar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
