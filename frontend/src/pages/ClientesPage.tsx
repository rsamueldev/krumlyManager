import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import {
  Cliente,
  createClienteApi,
  updateClienteApi,
  toggleActivoClienteApi,
} from '../services/clientesService';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Power,
  Phone,
  MapPin,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  UserCheck,
  UserX,
  Sparkles,
} from 'lucide-react';

export const ClientesPage: React.FC = () => {
  const { clientes, obtenerClientes, cargandoClientes, agregarClienteLocal, actualizarClienteLocal } = useData();

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Estado del Modal (Creación / Edición)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [cedulaRif, setCedulaRif] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [activo, setActivo] = useState(true);

  // Feedback State
  const [guardando, setGuardando] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  useEffect(() => {
    obtenerClientes();
  }, [obtenerClientes]);

  const mostrarNotificacion = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 4000);
  };

  // Abrir Modal para Crear
  const handleAbrirCrear = () => {
    setClienteEditando(null);
    setNombre('');
    setCedulaRif('');
    setTelefono('');
    setUbicacion('');
    setActivo(true);
    setErrorText(null);
    setModalAbierto(true);
  };

  // Abrir Modal para Editar
  const handleAbrirEditar = (c: Cliente) => {
    setClienteEditando(c);
    setNombre(c.nombre || '');
    setCedulaRif(c.cedulaRif || '');
    setTelefono(c.telefono || '');
    setUbicacion(c.ubicacion || '');
    setActivo(c.activo);
    setErrorText(null);
    setModalAbierto(true);
  };

  // Guardar (Crear o Actualizar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorText('El nombre o razón social es obligatorio.');
      return;
    }

    setGuardando(true);
    setErrorText(null);

    try {
      if (clienteEditando) {
        const actualizado = await updateClienteApi(clienteEditando.id, {
          nombre: nombre.trim(),
          cedulaRif: cedulaRif.trim() || null,
          telefono: telefono.trim() || null,
          ubicacion: ubicacion.trim() || null,
          activo,
        });
        actualizarClienteLocal(actualizado);
        mostrarNotificacion(`Cliente "${nombre.trim()}" actualizado con éxito.`);
      } else {
        const nuevo = await createClienteApi({
          nombre: nombre.trim(),
          cedulaRif: cedulaRif.trim() || null,
          telefono: telefono.trim() || null,
          ubicacion: ubicacion.trim() || null,
          activo,
        });
        agregarClienteLocal(nuevo);
        mostrarNotificacion(`Cliente "${nombre.trim()}" registrado con éxito.`);
      }

      setModalAbierto(false);
    } catch (err: any) {
      setErrorText(err.message || 'Error al guardar el cliente');
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar Estado (Activar / Desactivar)
  const handleToggleEstado = async (c: Cliente) => {
    try {
      const nuevoEstado = !c.activo;
      const actualizado = await toggleActivoClienteApi(c.id, nuevoEstado);
      actualizarClienteLocal(actualizado);
      mostrarNotificacion(
        `Cliente "${c.nombre}" ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`
      );
    } catch (err: any) {
      mostrarNotificacion(err.message || 'Error al cambiar estado del cliente');
    }
  };

  // Lista Filtrada por Búsqueda (Cédula, RIF, Nombre o Teléfono) y Filtro de Estado
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      // Filtro de Estado
      if (filtroEstado === 'activos' && !c.activo) return false;
      if (filtroEstado === 'inactivos' && c.activo) return false;

      // Filtro por Búsqueda
      if (!busqueda.trim()) return true;
      const term = busqueda.toLowerCase().trim();
      const coincideNombre = c.nombre.toLowerCase().includes(term);
      const coincideCedula = c.cedulaRif?.toLowerCase().includes(term) ?? false;
      const coincideTelefono = c.telefono?.toLowerCase().includes(term) ?? false;
      const coincideUbicacion = c.ubicacion?.toLowerCase().includes(term) ?? false;

      return coincideNombre || coincideCedula || coincideTelefono || coincideUbicacion;
    });
  }, [clientes, busqueda, filtroEstado]);

  // KPIs
  const totalClientes = clientes.length;
  const totalActivos = useMemo(() => clientes.filter((c) => c.activo).length, [clientes]);
  const totalInactivos = totalClientes - totalActivos;
  const totalVentasAsociadas = useMemo(
    () => clientes.reduce((sum, c) => sum + (c.totalVentas || 0), 0),
    [clientes]
  );

  return (
    <div className="space-y-6">
      {/* Alertas / Notificaciones */}
      {notificacion && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{notificacion}</span>
          </div>
          <button onClick={() => setNotificacion(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-krumly-border shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-krumly-red" />
            <h1 className="font-heading text-2xl font-bold text-krumly-chocolate">Directorio de Clientes</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Gestión completa de clientes, búsqueda rápida por Cédula/RIF y control de estado activo.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAbrirCrear}
          className="inline-flex items-center justify-center space-x-2 bg-krumly-red hover:bg-krumly-red-dark text-white text-xs font-bold uppercase tracking-wider py-3 px-5 rounded-2xl shadow-md shadow-krumly-red/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Clientes</p>
            <h3 className="font-heading text-2xl font-bold text-krumly-chocolate mt-0.5">{totalClientes}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clientes Activos</p>
            <h3 className="font-heading text-2xl font-bold text-emerald-600 mt-0.5">{totalActivos}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Desactivados</p>
            <h3 className="font-heading text-2xl font-bold text-gray-500 mt-0.5">{totalInactivos}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-krumly-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ventas Asociadas</p>
            <h3 className="font-heading text-2xl font-bold text-krumly-chocolate mt-0.5">{totalVentasAsociadas}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="bg-white p-4 rounded-2xl border border-krumly-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Input de Búsqueda Prominente */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por Cédula, RIF, Nombre o Teléfono..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros de Estado Pills */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-white text-krumly-chocolate shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Todos ({totalClientes})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('activos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filtroEstado === 'activos'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Activos ({totalActivos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('inactivos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filtroEstado === 'inactivos'
                ? 'bg-white text-gray-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Inactivos ({totalInactivos})
          </button>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-3xl border border-krumly-border shadow-xs overflow-hidden">
        {cargandoClientes ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-krumly-red border-t-transparent mb-2"></div>
            <p className="text-xs font-semibold">Cargando directorio de clientes...</p>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-heading text-base font-bold text-gray-600">No se encontraron clientes</h3>
            <p className="text-xs text-gray-400 mt-1">
              {busqueda
                ? `No hay coincidencias para "${busqueda}"`
                : 'Aún no has registrado ningún cliente en el sistema.'}
            </p>
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="mt-3 text-xs font-semibold text-krumly-red hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3.5 px-5">Cédula / RIF</th>
                  <th className="py-3.5 px-5">Cliente / Razón Social</th>
                  <th className="py-3.5 px-5">Teléfono</th>
                  <th className="py-3.5 px-5">Ubicación</th>
                  <th className="py-3.5 px-5 text-center">Compras</th>
                  <th className="py-3.5 px-5 text-center">Estado</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {clientesFiltrados.map((c) => {
                  const iniciales = c.nombre
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        !c.activo ? 'bg-gray-50/50 opacity-75' : ''
                      }`}
                    >
                      {/* Cédula / RIF */}
                      <td className="py-4 px-5">
                        {c.cedulaRif ? (
                          <span className="inline-flex items-center font-mono font-bold text-krumly-chocolate bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg text-[11px]">
                            {c.cedulaRif}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Sin Registrar</span>
                        )}
                      </td>

                      {/* Nombre con Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              c.activo
                                ? 'bg-krumly-chocolate text-amber-200'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {iniciales}
                          </div>
                          <div>
                            <p className="font-bold text-krumly-chocolate">{c.nombre}</p>
                            <p className="text-[10px] text-gray-400">ID: {c.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      {/* Teléfono */}
                      <td className="py-4 px-5">
                        {c.telefono ? (
                          <div className="flex items-center space-x-1.5 text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{c.telefono}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Ubicación */}
                      <td className="py-4 px-5">
                        {c.ubicacion ? (
                          <div className="flex items-center space-x-1.5 text-gray-600 max-w-xs truncate">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{c.ubicacion}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Compras / Ventas */}
                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center space-x-1 bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                          <ShoppingBag className="w-3 h-3" />
                          <span>{c.totalVentas || 0}</span>
                        </span>
                      </td>

                      {/* Estado (Activo / Inactivo) */}
                      <td className="py-4 px-5 text-center">
                        {c.activo ? (
                          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                            <span>Desactivado</span>
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(c)}
                            title="Editar cliente"
                            className="p-1.5 text-gray-500 hover:text-krumly-chocolate hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(c)}
                            title={c.activo ? 'Desactivar cliente' : 'Activar cliente'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              c.activo
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Crear / Editar Cliente */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-krumly-border shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-krumly-vanilla-cream px-6 py-4 border-b border-krumly-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-krumly-chocolate" />
                <h3 className="font-heading text-lg font-bold text-krumly-chocolate">
                  {clienteEditando ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              {errorText && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}

              {/* Cédula / RIF */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Cédula o RIF
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cedulaRif}
                    onChange={(e) => setCedulaRif(e.target.value)}
                    placeholder="Ej: V-12345678 / J-12345678-0"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red uppercase font-mono"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Identificador único para búsqueda rápida en caja (opcional).
                </p>
              </div>

              {/* Nombre / Razón Social */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nombre o Razón Social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: María Pérez o Repostería Dulce C.A."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red font-medium"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: 0412-1234567"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ubicación / Dirección
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Ej: Urb. Los Palos Grandes, Av. Principal"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                  />
                </div>
              </div>

              {/* Estado Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-700">Estado del Cliente</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-2 text-xs font-bold text-gray-600">
                    {activo ? 'Activo' : 'Desactivado'}
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-krumly-red hover:bg-krumly-red-dark text-white shadow-md shadow-krumly-red/20 transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {guardando ? (
                    <span>Guardando...</span>
                  ) : (
                    <span>{clienteEditando ? 'Actualizar Cliente' : 'Registrar Cliente'}</span>
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
