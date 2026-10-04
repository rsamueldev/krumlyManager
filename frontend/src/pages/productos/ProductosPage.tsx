import { createPortal } from 'react-dom';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { useData } from '../../context/DataContext';
import { Categoria, fetchCategoriasApi } from '../../services/categoriasService';
import { fetchInsumosApi, fetchRecetasApi, InsumoItem, Receta } from '../../services/recetasService';
import {
  createProductoApi,
  deleteProductoApi,
  fetchProductosApi,
  Producto,
  ProductoInsumoAdicional,
  updateProductoApi,
} from '../../services/productosService';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChefHat,
  Cookie,
  Edit2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';

export const ProductosPage: React.FC = () => {
  const { convertirUSDToVES } = useTasaCambio();

  const modalContainerRef = useRef<HTMLDivElement>(null);

  const { productos, categorias, recetas, insumos, cargandoProductos: cargando, obtenerProductos, obtenerCategorias, obtenerRecetas, obtenerInsumos, agregarProductoLocal, actualizarProductoLocal, eliminarProductoLocal } = useData();

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  // Modal & Wizard State
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [editandoProductoId, setEditandoProductoId] = useState<string | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [recetaId, setRecetaId] = useState('');
  const [pesoMasaGramos, setPesoMasaGramos] = useState<number>(120);
  const [precioVenta, setPrecioVenta] = useState<number>(2.5);
  const [stockActual, setStockActual] = useState<number>(25);
  const [stockMinimo, setStockMinimo] = useState<number>(10);

  // Indirect Costs & Toppings
  const [costoEmpaque, setCostoEmpaque] = useState<number>(0.05);
  const [costoManoObra, setCostoManoObra] = useState<number>(0.10);
  const [costoDepreciacion, setCostoDepreciacion] = useState<number>(0.03);
  const [porcentajeDesperdicio, setPorcentajeDesperdicio] = useState<number>(5);
  const [toppings, setToppings] = useState<ProductoInsumoAdicional[]>([]);

  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerProductos();
    obtenerCategorias();
    obtenerRecetas();
    obtenerInsumos();
  }, [obtenerProductos, obtenerCategorias, obtenerRecetas, obtenerInsumos]);

  const abrirModalNuevo = () => {
    setEditandoProductoId(null);
    setPasoActual(1);
    setNombre('');
    setCategoriaId(categorias.length > 0 ? categorias[0].id : '');
    setRecetaId(recetas.length > 0 ? recetas[0].id : '');
    setPesoMasaGramos(120);
    setPrecioVenta(2.5);
    setStockActual(25);
    setStockMinimo(10);
    setCostoEmpaque(0.05);
    setCostoManoObra(0.10);
    setCostoDepreciacion(0.03);
    setPorcentajeDesperdicio(5);
    setToppings([]);
    setErrorModal(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto: Producto) => {
    setEditandoProductoId(producto.id);
    setPasoActual(1);
    setNombre(producto.nombre);
    setCategoriaId(producto.categoriaId || '');
    setRecetaId(producto.recetaId || '');
    setPesoMasaGramos(producto.pesoMasaGramos);
    setPrecioVenta(producto.precioVenta);
    setStockActual(producto.stockActual);
    setStockMinimo(producto.stockMinimo);
    setCostoEmpaque(producto.costoEmpaque || 0);
    setCostoManoObra(producto.costoManoObra || 0);
    setCostoDepreciacion(producto.costoDepreciacion || 0);
    setPorcentajeDesperdicio(producto.porcentajeDesperdicio ?? 5);
    setToppings(
      (producto.insumosAdicionales || []).map((t) => ({
        ...t,
        costoCalculado: t.costoCalculado ?? (t.insumo ? Number((t.cantidad * t.insumo.costoUnitario).toFixed(4)) : 0),
      })),
    );
    setErrorModal(null);
    setModalAbierto(true);
  };

  // Cálculos dinámicos en tiempo real
  const recetaSeleccionada = useMemo(() => {
    return recetas.find((r) => r.id === recetaId);
  }, [recetas, recetaId]);

  const costoMasaCalculado = useMemo(() => {
    if (!recetaSeleccionada) return 0;
    return Number((pesoMasaGramos * recetaSeleccionada.costoPorGramo).toFixed(4));
  }, [pesoMasaGramos, recetaSeleccionada]);

  const costoToppingsCalculado = useMemo(() => {
    return toppings.reduce((acc, curr) => {
      const insumo = insumos.find((i) => i.id === curr.insumoId) || curr.insumo;
      const costoUnitario = insumo ? insumo.costoUnitario : 0;
      return acc + curr.cantidad * costoUnitario;
    }, 0);
  }, [toppings, insumos]);

  const subtotalDirectoSinDesperdicio = useMemo(() => {
    return (
      costoMasaCalculado +
      costoToppingsCalculado +
      costoEmpaque +
      costoManoObra +
      costoDepreciacion
    );
  }, [costoMasaCalculado, costoToppingsCalculado, costoEmpaque, costoManoObra, costoDepreciacion]);

  const costoDirectoTotalCalculado = useMemo(() => {
    const factorDesperdicio = 1 + Math.max(0, porcentajeDesperdicio) / 100;
    return Number((subtotalDirectoSinDesperdicio * factorDesperdicio).toFixed(2));
  }, [subtotalDirectoSinDesperdicio, porcentajeDesperdicio]);

  const margenEstimadoCalculado = useMemo(() => {
    if (precioVenta <= 0) return 0;
    return Number((((precioVenta - costoDirectoTotalCalculado) / precioVenta) * 100).toFixed(2));
  }, [precioVenta, costoDirectoTotalCalculado]);

  const esVentaEnPerdida = useMemo(() => {
    return precioVenta <= costoDirectoTotalCalculado;
  }, [precioVenta, costoDirectoTotalCalculado]);

  // Manejadores Toppings
  const handleAgregarTopping = () => {
    const defaultInsumo = insumos.length > 0 ? insumos[0] : undefined;
    setToppings([
      ...toppings,
      {
        insumoId: defaultInsumo ? defaultInsumo.id : '',
        cantidad: 15,
        costoCalculado: defaultInsumo ? Number((15 * defaultInsumo.costoUnitario).toFixed(4)) : 0,
        insumo: defaultInsumo,
      },
    ]);
  };

  const handleCambiarToppingInsumo = (index: number, insumoId: string) => {
    const targetInsumo = insumos.find((i) => i.id === insumoId);
    const nuevosToppings = [...toppings];
    const item = nuevosToppings[index];
    const costoUnit = targetInsumo ? targetInsumo.costoUnitario : 0;

    nuevosToppings[index] = {
      ...item,
      insumoId,
      insumo: targetInsumo,
      costoCalculado: Number((item.cantidad * costoUnit).toFixed(4)),
    };
    setToppings(nuevosToppings);
  };

  const handleCambiarToppingCantidad = (index: number, cantidad: number) => {
    const nuevosToppings = [...toppings];
    const item = nuevosToppings[index];
    const targetInsumo = insumos.find((i) => i.id === item.insumoId) || item.insumo;
    const costoUnit = targetInsumo ? targetInsumo.costoUnitario : 0;

    nuevosToppings[index] = {
      ...item,
      cantidad: cantidad >= 0 ? cantidad : 0,
      costoCalculado: Number((Math.max(0, cantidad) * costoUnit).toFixed(4)),
    };
    setToppings(nuevosToppings);
  };

  const handleEliminarTopping = (index: number) => {
    setToppings(toppings.filter((_, i) => i !== index));
  };

  // Navegación del Wizard
  const handleSiguientePaso = () => {
    setErrorModal(null);
    if (pasoActual === 1) {
      if (!nombre.trim()) {
        setErrorModal('Ingresa el nombre del producto para continuar.');
        return;
      }
      if (pesoMasaGramos <= 0) {
        setErrorModal('El peso de la masa debe ser mayor a 0 gramos.');
        return;
      }
    }
    if (pasoActual < 3) {
      setPasoActual(pasoActual + 1);
    }
  };

  const handleAnteriorPaso = () => {
    setErrorModal(null);
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  const handleGuardarProducto = async () => {
    setErrorModal(null);

    if (!nombre.trim()) {
      setErrorModal('El nombre del producto es obligatorio.');
      modalContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (precioVenta <= 0) {
      setErrorModal('El precio de venta debe ser mayor a 0 USD.');
      modalContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setGuardando(true);
    try {
      const payload: Partial<Producto> = {
        nombre: nombre.trim(),
        categoriaId: categoriaId || undefined,
        recetaId: recetaId || undefined,
        pesoMasaGramos,
        costoEmpaque,
        costoManoObra,
        costoDepreciacion,
        porcentajeDesperdicio,
        precioVenta,
        stockActual,
        stockMinimo,
        insumosAdicionales: toppings
          .filter((t) => t.insumoId && t.cantidad > 0)
          .map((t) => ({
            insumoId: t.insumoId,
            cantidad: t.cantidad,
          })),
      };

      if (editandoProductoId) {
        const actualizado = await updateProductoApi(editandoProductoId, payload);
        actualizarProductoLocal(actualizado);
        setNotificacion('¡Ficha técnica del producto actualizada exitosamente!');
      } else {
        const nuevo = await createProductoApi(payload);
        agregarProductoLocal(nuevo);
        setNotificacion('¡Producto comercial registrado exitosamente!');
      }

      setModalAbierto(false);
      setTimeout(() => setNotificacion(null), 3500);
    } catch (err: any) {
      setErrorModal(err.message || 'Error inesperado al guardar el producto');
      modalContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarProducto = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo comercial?')) return;
    try {
      await deleteProductoApi(id);
      eliminarProductoLocal(id);
      setNotificacion('Producto eliminado correctamente');
      setTimeout(() => setNotificacion(null), 3000);
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el producto');
    }
  };

  // Filtrado de productos con estricta deduplicación por ID
  const productosFiltrados = useMemo(() => {
    const mapUnicos = new Map<string, Producto>();
    productos.forEach((p) => {
      if (p && p.id) mapUnicos.set(p.id, p);
    });
    const unicos = Array.from(mapUnicos.values());

    return unicos.filter((p) => {
      const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCat = filtroCategoria === 'todas' || p.categoriaId === filtroCategoria;
      return coincideNombre && coincideCat;
    });
  }, [productos, busqueda, filtroCategoria]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-krumly-red mb-1">
            <Cookie className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Catálogo Comercial & Costeo</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-krumly-chocolate tracking-tight">
            Catálogo de Productos
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Definición de galletas comerciales, asignación de masa base, insumos adicionales/toppings y análisis de margen de ganancia neto.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => refrescarProductos()}
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
            <span>Nuevo Producto</span>
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

      {/* Buscador & Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-krumly-border shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar galleta o producto..."
            className="w-full pl-10 pr-4 py-2 bg-krumly-cream/40 border border-krumly-border rounded-xl text-xs font-medium text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-bold text-gray-500">Categoría:</span>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 bg-krumly-cream/40 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
          >
            <option value="todas">Todas las Categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Productos */}
      {cargando ? (
        <div className="bg-white p-12 rounded-2xl border border-krumly-border text-center text-xs text-gray-400 font-medium">
          Cargando productos comerciales desde la base de datos...
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-krumly-border text-center text-xs text-gray-400 font-medium">
          No hay productos registrados en la base de datos. Haz clic en "Nuevo Producto" para registrar la primera galleta comercial.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {productosFiltrados.map((prod) => {
            const esStockBajo = prod.stockActual <= prod.stockMinimo;
            const precioBs = convertirUSDToVES(prod.precioVenta);
            const esPerdida = prod.precioVenta <= prod.costoDirectoTotal;

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between ${
                  esPerdida ? 'border-red-300 ring-2 ring-red-500/20' : 'border-krumly-border'
                }`}
              >
                <div className="space-y-3">
                  {/* Icon & Badges Header */}
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-krumly-cream border border-krumly-border flex items-center justify-center text-krumly-red shrink-0 shadow-2xs">
                      <Cookie className="w-6 h-6" />
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      {prod.categoria && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100/70 border border-amber-200 text-amber-800 font-bold text-[10px]">
                          {prod.categoria.nombre}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          esStockBajo ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        Stock: {prod.stockActual} ud
                      </span>
                    </div>
                  </div>

                  {/* Titulo */}
                  <div>
                    <h3 className="font-heading font-bold text-base text-krumly-chocolate leading-tight">
                      {prod.nombre}
                    </h3>
                    {prod.receta && (
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 flex items-center space-x-1">
                        <ChefHat className="w-3.5 h-3.5 text-krumly-red shrink-0" />
                        <span>
                          {prod.receta.nombre} ({prod.pesoMasaGramos}g masa)
                        </span>
                      </p>
                    )}
                    {prod.insumosAdicionales && prod.insumosAdicionales.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {prod.insumosAdicionales.map((t) => (
                          <span
                            key={t.id || t.insumoId}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-[10px] text-amber-900 font-semibold"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>
                              {t.insumo?.nombre || 'Topping'}: {t.cantidad}g
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ficha Costos Card */}
                  <div className="bg-[#FFF9F5] border border-krumly-border rounded-xl p-3 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Costo Masa:</span>
                      <span className="font-semibold text-gray-700">${prod.costoMasaUnidad.toFixed(3)} USD</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-600">
                      <span>Costo Directo Total:</span>
                      <strong className="text-krumly-chocolate font-bold">
                        ${prod.costoDirectoTotal.toFixed(2)} USD
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-gray-600 border-t border-krumly-border/50 pt-1">
                      <span>Precio Venta:</span>
                      <strong className="text-krumly-red font-bold text-sm">
                        ${prod.precioVenta.toFixed(2)} USD
                      </strong>
                    </div>

                    <p className="text-[10px] text-right font-medium text-gray-400">
                      ({precioBs.toFixed(2)} Bs)
                    </p>
                  </div>
                </div>

                {/* Margen % & Alerta */}
                <div className="border-t border-krumly-border pt-3 flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    {esPerdida ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-lg text-[11px] animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>PÉRDI: {prod.margenGananciaPorcentaje.toFixed(1)}%</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Margen: {prod.margenGananciaPorcentaje.toFixed(1)}%</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(prod)}
                      className="p-1.5 text-gray-400 hover:text-krumly-chocolate hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Editar producto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarProducto(prod.id)}
                      className="p-1.5 text-gray-400 hover:text-krumly-red hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL WIZARD DE FICHA TÉCNICA (SIN ATRIBUTO FORM O ENTER AUTO-SUBMIT) */}
      {modalAbierto && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto">
          <div
            ref={modalContainerRef}
            className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-krumly-border animate-in fade-in zoom-in-95 duration-150 space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto my-auto"
          >
            
            {/* Header del Modal */}
            <div className="flex justify-between items-center border-b border-krumly-border pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-krumly-cream rounded-lg text-krumly-red">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-krumly-chocolate leading-tight">
                    {editandoProductoId ? 'Editar Ficha Técnica de Producto' : 'Nuevo Producto Comercial'}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">Paso {pasoActual} de 3</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BARRA DE PROGRESO DE ESTADO / STEPPER DE 3 PASOS */}
            <div className="grid grid-cols-3 gap-2 relative">
              {/* Paso 1 Badge */}
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all flex items-center justify-center space-x-2 ${
                  pasoActual === 1
                    ? 'bg-krumly-red text-white border-krumly-red shadow-xs font-bold'
                    : pasoActual > 1
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}
              >
                {pasoActual > 1 ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-xs font-extrabold">1</span>
                )}
                <span className="text-[11px] truncate">Info & Masa</span>
              </button>

              {/* Paso 2 Badge */}
              <button
                type="button"
                onClick={() => {
                  if (nombre.trim() && pesoMasaGramos > 0) setPasoActual(2);
                }}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all flex items-center justify-center space-x-2 ${
                  pasoActual === 2
                    ? 'bg-krumly-red text-white border-krumly-red shadow-xs font-bold'
                    : pasoActual > 2
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}
              >
                {pasoActual > 2 ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-xs font-extrabold">2</span>
                )}
                <span className="text-[11px] truncate">Toppings</span>
              </button>

              {/* Paso 3 Badge */}
              <button
                type="button"
                onClick={() => {
                  if (nombre.trim() && pesoMasaGramos > 0) setPasoActual(3);
                }}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all flex items-center justify-center space-x-2 ${
                  pasoActual === 3
                    ? 'bg-krumly-red text-white border-krumly-red shadow-xs font-bold'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}
              >
                <span className="text-xs font-extrabold">3</span>
                <span className="text-[11px] truncate">Precio & Resumen</span>
              </button>
            </div>

            {/* Error Modal (Superior) */}
            {errorModal && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorModal}</span>
              </div>
            )}

            {/* CONTENEDOR PRINCIPAL SIN FORM ELEMENT */}
            <div className="space-y-4">
              
              {/* PASO 1: INFORMACIÓN GENERAL Y MASA BASE */}
              {pasoActual === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-[#FFF9F5] p-3 rounded-xl border border-krumly-border">
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-krumly-chocolate">
                      Paso 1: Información General y Masa Base
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Define el nombre comercial de la galleta y asigna la mezcla de masa base de cocina.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Producto</label>
                    <input
                      type="text"
                      value={nombre}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Galleta Tradicional Choco-Vainilla 120g"
                      className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Categoría de Producto</label>
                      <select
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      >
                        <option value="">-- Sin Categoría --</option>
                        {categorias.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Receta Base de Masa</label>
                      <select
                        value={recetaId}
                        onChange={(e) => setRecetaId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      >
                        <option value="">-- Seleccionar Receta Base --</option>
                        {recetas.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nombre} (${r.costoPorGramo.toFixed(4)}/g)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Masa Asignada por Galleta (Gramos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pesoMasaGramos || ''}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      onChange={(e) => setPesoMasaGramos(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                    />
                  </div>

                  {/* Resumen Costo Masa Paso 1 */}
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-900">Costo de Masa por Unidad:</span>
                    <span className="font-bold text-xs text-krumly-red bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                      ${costoMasaCalculado.toFixed(4)} USD
                    </span>
                  </div>
                </div>
              )}

              {/* PASO 2: TOPPINGS Y RELLENOS ADICIONALES */}
              {pasoActual === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-[#FFF9F5] p-3 rounded-xl border border-krumly-border flex justify-between items-center">
                    <div>
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-krumly-chocolate flex items-center space-x-1">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Paso 2: Toppings y Rellenos Adicionales</span>
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Agrega bañados, rellenos o decoraciones por galleta (ej: Nutella, Chispas Hershey's).
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-500 font-bold shrink-0">
                      {toppings.length} toppings
                    </span>
                  </div>

                  <div className="border border-krumly-border rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-[#FFF9F5] px-3 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-krumly-border">
                      <div className="col-span-6">Insumo Adicional</div>
                      <div className="col-span-3">Cantidad (g/ml)</div>
                      <div className="col-span-2 text-right">Costo</div>
                      <div className="col-span-1"></div>
                    </div>

                    <div className="divide-y divide-krumly-border/60 bg-white">
                      {toppings.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400 font-medium">
                          Esta galleta no tiene toppings o rellenos adicionales. Haz clic en "Agregar Topping" si requiere alguno.
                        </div>
                      ) : (
                        toppings.map((top, idx) => {
                          const targetInsumo = insumos.find((i) => i.id === top.insumoId) || top.insumo;
                          const costoUnit = targetInsumo ? targetInsumo.costoUnitario : 0;
                          const subtotal = Number((top.cantidad * costoUnit).toFixed(3));

                          return (
                            <div key={idx} className="px-3 py-2 grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-6">
                                <select
                                  value={top.insumoId}
                                  onChange={(e) => handleCambiarToppingInsumo(idx, e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-krumly-border rounded-lg text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                                >
                                  {insumos.map((ins) => (
                                    <option key={ins.id} value={ins.id}>
                                      {ins.nombre} (${ins.costoUnitario.toFixed(4)}/{ins.unidadMedida === 'gramos' ? 'g' : ins.unidadMedida})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-span-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={top.cantidad || ''}
                                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                  onChange={(e) => handleCambiarToppingCantidad(idx, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 bg-white border border-krumly-border rounded-lg text-xs font-bold text-center text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                                />
                              </div>

                              <div className="col-span-2 text-right font-bold text-xs text-krumly-chocolate">
                                ${subtotal.toFixed(3)}
                              </div>

                              <div className="col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleEliminarTopping(idx)}
                                  className="p-1 text-gray-400 hover:text-krumly-red rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAgregarTopping}
                    className="inline-flex items-center space-x-1.5 border border-krumly-red text-krumly-red hover:bg-krumly-red/5 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Agregar Topping</span>
                  </button>
                </div>
              )}

              {/* PASO 3: PRECIO DE VENTA Y COSTOS INDIRECTOS */}
              {pasoActual === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-[#FFF9F5] p-3 rounded-xl border border-krumly-border">
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-krumly-chocolate">
                      Paso 3: Precio de Venta, Costos Indirectos y Margen Neto
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Ajusta los empaques, mano de obra, depreciación y define el precio público final en USD.
                    </p>
                  </div>

                  {/* Campo Precio de Venta */}
                  <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
                    <label className="block text-xs font-bold text-amber-900">
                      💵 Precio de Venta Público (USD $)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-amber-700">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={precioVenta || ''}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        onChange={(e) => setPrecioVenta(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-amber-800 font-medium">
                      Equivalente aproximado en Bolívares: <strong>{convertirUSDToVES(precioVenta).toFixed(2)} Bs</strong>
                    </p>
                  </div>

                  {/* Grid de Costos Indirectos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Empaque ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costoEmpaque || ''}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        onChange={(e) => setCostoEmpaque(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Mano de Obra ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costoManoObra || ''}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        onChange={(e) => setCostoManoObra(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Depreciación ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costoDepreciacion || ''}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        onChange={(e) => setCostoDepreciacion(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Desperdicio (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={porcentajeDesperdicio || ''}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        onChange={(e) => setPorcentajeDesperdicio(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Stock Inicial</label>
                      <input
                        type="number"
                        min="0"
                        value={stockActual || ''}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        onChange={(e) => setStockActual(e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3.5 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Stock Mínimo Alerta</label>
                      <input
                        type="number"
                        min="0"
                        value={stockMinimo || ''}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        onChange={(e) => setStockMinimo(e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3.5 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Banner de Alerta Roja de Pérdida */}
                  {esVentaEnPerdida && (
                    <div className="bg-red-500 text-white p-3.5 rounded-xl border border-red-600 flex items-center space-x-3 shadow-md animate-pulse">
                      <AlertTriangle className="w-6 h-6 shrink-0" />
                      <div>
                        <h5 className="font-heading font-bold text-xs uppercase tracking-wide">
                          ⚠️ ¡Alerta Financiera de Pérdida!
                        </h5>
                        <p className="text-[11px] font-medium leading-tight">
                          El Precio de Venta (${precioVenta.toFixed(2)}) es menor o igual al Costo Directo Total (${costoDirectoTotalCalculado.toFixed(2)} USD). Esta galleta no obtendrá margen de ganancia.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ficha Resumen Financiero Completa */}
                  <div className="bg-[#FFF9F5] p-4 rounded-xl border border-krumly-border space-y-2 text-xs">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-gray-600">
                      <div>
                        <span>Costo Masa:</span> <strong className="text-krumly-chocolate">${costoMasaCalculado.toFixed(3)}</strong>
                      </div>
                      <div>
                        <span>Costo Toppings:</span> <strong className="text-krumly-chocolate">${costoToppingsCalculado.toFixed(3)}</strong>
                      </div>
                      <div>
                        <span>Indirectos:</span> <strong className="text-krumly-chocolate">${(costoEmpaque + costoManoObra + costoDepreciacion).toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-krumly-border/60 pt-2">
                      <span className="font-bold text-gray-700">Costo Directo Total (+{porcentajeDesperdicio}% desperdicio):</span>
                      <span className="font-bold text-krumly-chocolate text-base">
                        ${costoDirectoTotalCalculado.toFixed(2)} USD{' '}
                        <span className="text-xs text-gray-500 font-normal">
                          ({convertirUSDToVES(costoDirectoTotalCalculado).toFixed(2)} Bs)
                        </span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-krumly-border/60 pt-2">
                      <span className="font-bold text-gray-700">Margen Neto Estimado:</span>
                      <span
                        className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                          esVentaEnPerdida ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {margenEstimadoCalculado.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Modal (Inferior para visibilidad en Paso 3) */}
              {errorModal && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorModal}</span>
                </div>
              )}

              {/* BARRA DE NAVEGACIÓN Y BOTONES DEL WIZARD */}
              <div className="flex justify-between items-center pt-3 border-t border-krumly-border">
                {pasoActual > 1 ? (
                  <button
                    type="button"
                    onClick={handleAnteriorPaso}
                    className="inline-flex items-center space-x-1 px-4 py-2.5 border border-krumly-border rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>
                ) : (
                  <div></div>
                )}

                {pasoActual < 3 ? (
                  <button
                    type="button"
                    onClick={handleSiguientePaso}
                    className="inline-flex items-center space-x-1 px-5 py-2.5 bg-krumly-red hover:bg-krumly-red-dark text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGuardarProducto}
                    disabled={guardando}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 bg-krumly-red hover:bg-krumly-red-dark disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    <Save className="w-4 h-4" />
                    <span>{guardando ? 'Guardando...' : editandoProductoId ? 'Actualizar Ficha' : 'Guardar Producto'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
