import React, { useEffect, useMemo, useState } from 'react';
import { useTasaCambio } from '../../context/TasaCambioContext';
import {
  fetchInsumosApi,
  fetchRecetasApi,
  InsumoItem,
  Receta,
  RecetaInsumoItem,
  saveRecetaApi,
} from '../../services/recetasService';
import {
  HelpCircle,
  Plus,
  Scale,
  Search,
  Trash2,
  Save,
  FileEdit,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const RecetasPage: React.FC = () => {
  const { tasaCambioBs } = useTasaCambio();

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [insumos, setInsumos] = useState<InsumoItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [recetaSeleccionadaId, setRecetaSeleccionadaId] = useState<string | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [pesoTotalGramos, setPesoTotalGramos] = useState<number>(1000);
  const [ingredientes, setIngredientes] = useState<RecetaInsumoItem[]>([]);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  // Cargar datos reales desde la API al montar
  useEffect(() => {
    async function loadData() {
      const [recetasData, insumosData] = await Promise.all([
        fetchRecetasApi(),
        fetchInsumosApi(),
      ]);
      setRecetas(recetasData);
      setInsumos(insumosData);

      if (recetasData.length > 0) {
        cargarRecetaEnFormulario(recetasData[0]);
      }
    }
    loadData();
  }, []);

  const cargarRecetaEnFormulario = (receta: Receta) => {
    setRecetaSeleccionadaId(receta.id);
    setNombre(receta.nombre);
    setPesoTotalGramos(receta.pesoTotalMezclaGramos);
    setIngredientes(
      receta.insumos.map((i) => ({
        ...i,
        costoCalculado:
          i.costoCalculado ??
          (i.insumo
            ? Number((i.cantidad * i.insumo.costoUnitario).toFixed(2))
            : 0),
      })),
    );
  };

  const handleNuevaReceta = () => {
    setRecetaSeleccionadaId(null);
    setNombre('');
    setPesoTotalGramos(1000);
    // Añadir un renglón limpio por defecto
    setIngredientes([
      {
        insumoId: insumos.length > 0 ? insumos[0].id : '',
        cantidad: 100,
        costoCalculado: insumos.length > 0 ? Number((100 * insumos[0].costoUnitario).toFixed(2)) : 0,
        insumo: insumos.length > 0 ? insumos[0] : undefined,
      },
    ]);
  };

  // Filtrar lista de recetas
  const recetasFiltradas = useMemo(() => {
    return recetas.filter((r) =>
      r.nombre.toLowerCase().includes(busqueda.toLowerCase()),
    );
  }, [recetas, busqueda]);

  // Cálculos dinámicos en tiempo real para la receta en edición
  const { costoTotalLote, costoPorGramo, costoTotalLoteBs } = useMemo(() => {
    const total = ingredientes.reduce((acc, curr) => {
      const insumo = insumos.find((i) => i.id === curr.insumoId);
      const costoUnitario = insumo ? insumo.costoUnitario : (curr.insumo?.costoUnitario || 0);
      return acc + curr.cantidad * costoUnitario;
    }, 0);

    const peso = pesoTotalGramos > 0 ? pesoTotalGramos : 1;
    const porGramo = total / peso;
    const totalBs = total * tasaCambioBs;

    return {
      costoTotalLote: Number(total.toFixed(2)),
      costoPorGramo: Number(porGramo.toFixed(4)),
      costoTotalLoteBs: Number(totalBs.toFixed(2)),
    };
  }, [ingredientes, pesoTotalGramos, insumos, tasaCambioBs]);

  const handleAgregarIngrediente = () => {
    const defaultInsumo = insumos.length > 0 ? insumos[0] : undefined;
    setIngredientes([
      ...ingredientes,
      {
        insumoId: defaultInsumo ? defaultInsumo.id : '',
        cantidad: 100,
        costoCalculado: defaultInsumo ? Number((100 * defaultInsumo.costoUnitario).toFixed(2)) : 0,
        insumo: defaultInsumo,
      },
    ]);
  };

  const handleCambiarInsumo = (index: number, insumoId: string) => {
    const targetInsumo = insumos.find((i) => i.id === insumoId);
    const nuevosIngredientes = [...ingredientes];
    const item = nuevosIngredientes[index];
    const costoUnit = targetInsumo ? targetInsumo.costoUnitario : 0;

    nuevosIngredientes[index] = {
      ...item,
      insumoId,
      insumo: targetInsumo,
      costoCalculado: Number((item.cantidad * costoUnit).toFixed(2)),
    };
    setIngredientes(nuevosIngredientes);
  };

  const handleCambiarCantidad = (index: number, cantidad: number) => {
    const nuevosIngredientes = [...ingredientes];
    const item = nuevosIngredientes[index];
    const targetInsumo = insumos.find((i) => i.id === item.insumoId) || item.insumo;
    const costoUnit = targetInsumo ? targetInsumo.costoUnitario : 0;

    nuevosIngredientes[index] = {
      ...item,
      cantidad: cantidad >= 0 ? cantidad : 0,
      costoCalculado: Number((Math.max(0, cantidad) * costoUnit).toFixed(2)),
    };
    setIngredientes(nuevosIngredientes);
  };

  const handleEliminarIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const handleGuardarReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGuardado(null);

    if (!nombre.trim()) {
      setErrorGuardado('Por favor ingresa un nombre para la receta.');
      return;
    }
    if (pesoTotalGramos <= 0) {
      setErrorGuardado('El peso total obtenido debe ser mayor a 0 gramos.');
      return;
    }
    if (ingredientes.length === 0) {
      setErrorGuardado('Debe agregar al menos un ingrediente a la receta.');
      return;
    }
    if (ingredientes.some((i) => !i.insumoId)) {
      setErrorGuardado('Todos los ingredientes deben tener un insumo seleccionado.');
      return;
    }

    try {
      const payload: Partial<Receta> = {
        id: recetaSeleccionadaId || undefined,
        nombre: nombre.trim(),
        pesoTotalMezclaGramos: pesoTotalGramos,
        costoTotalLote,
        costoPorGramo,
        insumos: ingredientes,
      };

      const guardada = await saveRecetaApi(payload);

      if (recetaSeleccionadaId) {
        setRecetas(recetas.map((r) => (r.id === recetaSeleccionadaId ? guardada : r)));
      } else {
        setRecetas([guardada, ...recetas]);
        setRecetaSeleccionadaId(guardada.id);
      }

      setNotificacion('¡Receta guardada exitosamente en la base de datos!');
      setTimeout(() => setNotificacion(null), 3500);
    } catch (err: any) {
      setErrorGuardado(err.message || 'Error al guardar la receta en la base de datos');
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {notificacion && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-2 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-xs">{notificacion}</span>
        </div>
      )}

      {errorGuardado && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 animate-in fade-in duration-200 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold text-xs">{errorGuardado}</span>
        </div>
      )}

      {/* Grid Principal Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* PANEL IZQUIERDO: Buscador y Lista de Recetas */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          {/* Botón Principal Nueva Receta (Sin '+' duplicado en el texto) */}
          <button
            type="button"
            onClick={handleNuevaReceta}
            className="w-full bg-krumly-red hover:bg-krumly-red-dark text-white font-bold py-3 px-4 rounded-2xl shadow-md shadow-krumly-red/20 transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Receta</span>
          </button>

          {/* Input de Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar receta..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-krumly-border rounded-2xl text-xs font-medium text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none shadow-xs"
            />
          </div>

          {/* Lista de Tarjetas de Recetas */}
          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {recetasFiltradas.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-krumly-border text-center text-xs text-gray-400 font-medium">
                No hay recetas registradas en la base de datos
              </div>
            ) : (
              recetasFiltradas.map((receta) => {
                const esSeleccionada = receta.id === recetaSeleccionadaId;
                return (
                  <div
                    key={receta.id}
                    onClick={() => cargarRecetaEnFormulario(receta)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer shadow-xs border ${
                      esSeleccionada
                        ? 'bg-[#FDF6F0] border-2 border-krumly-red shadow-sm'
                        : 'bg-white border-krumly-border hover:border-krumly-red/40 hover:bg-amber-50/30'
                    }`}
                  >
                    <h3 className="font-heading font-bold text-xs text-krumly-chocolate mb-1 leading-snug">
                      {receta.nombre}
                    </h3>
                    <p className="text-[11px] font-medium text-gray-500">
                      Costo/g: <strong className="text-krumly-chocolate font-bold">${receta.costoPorGramo.toFixed(4)}/g</strong>
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL DERECHO: Formulario de Edición / Creación de Receta */}
        <div className="flex-1 w-full bg-white rounded-2xl p-6 md:p-8 border border-krumly-border shadow-xs">
          <form onSubmit={handleGuardarReceta} className="space-y-6">
            {/* Header del Formulario */}
            <div className="flex items-center space-x-2 border-b border-krumly-border pb-4">
              <div className="p-2 bg-krumly-cream rounded-xl text-krumly-red">
                <FileEdit className="w-5 h-5" />
              </div>
              <h2 className="font-heading text-lg font-bold text-krumly-chocolate">
                {recetaSeleccionadaId ? 'Editar Receta' : 'Crear Nueva Receta'}
              </h2>
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer hover:text-krumly-red transition-colors ml-auto" />
            </div>

            {/* Inputs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Nombre de la Receta / Mezcla
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Masa Base de Vainilla"
                  className="w-full px-4 py-2.5 bg-white border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Peso Total Obtenido (Gramos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={pesoTotalGramos}
                  onChange={(e) => setPesoTotalGramos(Number(e.target.value))}
                  placeholder="Ej. 1080"
                  className="w-full px-4 py-2.5 bg-white border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Sección Tabla de Ingredientes */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-xs text-krumly-chocolate uppercase tracking-wide">
                  Ingredientes de la mezcla
                </h3>
                <span className="text-[11px] text-gray-500 font-medium">
                  {ingredientes.length} {ingredientes.length === 1 ? 'ingrediente agregado' : 'ingredientes agregados'}
                </span>
              </div>

              {/* Contenedor Tabla */}
              <div className="border border-krumly-border rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-[#FFF9F5] px-4 py-2.5 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-krumly-border">
                  <div className="col-span-5 md:col-span-6">Insumo</div>
                  <div className="col-span-3 md:col-span-3">Cantidad (g/ml)</div>
                  <div className="col-span-3 md:col-span-2 text-right">Costo Acumulado</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                <div className="divide-y divide-krumly-border/60 bg-white">
                  {ingredientes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 font-medium">
                      No has agregado ingredientes a esta mezcla. Haz clic en "Agregar Ingrediente".
                    </div>
                  ) : (
                    ingredientes.map((item, idx) => {
                      const insumoTarget = insumos.find((i) => i.id === item.insumoId) || item.insumo;
                      const costoUnit = insumoTarget ? insumoTarget.costoUnitario : 0;
                      const subtotal = Number((item.cantidad * costoUnit).toFixed(2));

                      return (
                        <div
                          key={idx}
                          className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-amber-50/20 transition-colors"
                        >
                          {/* Dropdown Insumo */}
                          <div className="col-span-5 md:col-span-6">
                            <select
                              value={item.insumoId}
                              onChange={(e) => handleCambiarInsumo(idx, e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                            >
                              {insumos.length === 0 ? (
                                <option value="">-- Registra insumos primero en Inventario --</option>
                              ) : (
                                insumos.map((ins) => (
                                  <option key={ins.id} value={ins.id}>
                                    {ins.nombre} ({ins.unidadMedida})
                                  </option>
                                ))
                              )}
                            </select>
                          </div>

                          {/* Input Cantidad */}
                          <div className="col-span-3 md:col-span-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.cantidad}
                              onChange={(e) => handleCambiarCantidad(idx, Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate text-center focus:ring-2 focus:ring-krumly-red focus:outline-none"
                            />
                          </div>

                          {/* Costo Acumulado */}
                          <div className="col-span-3 md:col-span-2 text-right">
                            <span className="font-bold text-xs text-krumly-chocolate">
                              ${subtotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Action Trash Icon */}
                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleEliminarIngrediente(idx)}
                              className="p-1.5 text-gray-400 hover:text-krumly-red rounded-lg transition-colors cursor-pointer"
                              title="Eliminar ingrediente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Botón Agregar Ingrediente (Sin '+' duplicado en texto) */}
              <button
                type="button"
                onClick={handleAgregarIngrediente}
                className="inline-flex items-center space-x-2 border border-krumly-red text-krumly-red hover:bg-krumly-red/5 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-2xs mt-1"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Agregar Ingrediente</span>
              </button>
            </div>

            {/* Ficha Resumen de Costos */}
            <div className="bg-[#FDF8F3] border border-krumly-border rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs mt-6">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100/70 border border-amber-200/60 flex items-center justify-center text-krumly-red shrink-0 shadow-2xs">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-krumly-chocolate leading-tight">
                    Resumen de Costos
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-tight">
                    Cálculo en tiempo real basado en insumos
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-krumly-border/50 pt-3 sm:pt-0">
                <p className="text-xs font-medium text-gray-600">
                  Costo Total del Lote:{' '}
                  <strong className="text-sm font-bold text-krumly-chocolate">
                    ${costoTotalLote.toFixed(2)} USD
                  </strong>{' '}
                  <span className="text-[11px] text-gray-500 font-normal">
                    ({costoTotalLoteBs.toFixed(2)} Bs)
                  </span>
                </p>
                <p className="text-xs font-medium text-gray-600 mt-0.5">
                  Costo por Gramo:{' '}
                  <strong className="text-sm font-bold text-krumly-red">
                    ${costoPorGramo.toFixed(4)}
                  </strong>
                </p>
              </div>
            </div>

            {/* Botón Principal Guardar Receta (Sin emoji '💾' duplicado) */}
            <button
              type="submit"
              className="w-full bg-krumly-red hover:bg-krumly-red-dark text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-krumly-red/20 transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs uppercase tracking-wider mt-6"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Receta</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
