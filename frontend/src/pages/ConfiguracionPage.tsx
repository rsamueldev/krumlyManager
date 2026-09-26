import React, { useState, useEffect } from 'react';
import { useTasaCambio } from '../context/TasaCambioContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Flame,
  Globe,
  HardDrive,
  Percent,
  Phone,
  QrCode,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';

interface DatosPagoMovil {
  banco: string;
  cedulaRif: string;
  telefono: string;
  nombreTitular: string;
  emailZelle: string;
  notaPago: string;
}

interface ParametrosCocina {
  margenObjetivoPorcentaje: number;
  desperdicioEstandarPorcentaje: number;
  diasCaducidadGalletas: number;
  stockMinimoGlobal: number;
}

export const ConfiguracionPage: React.FC = () => {
  const { tasaCambioBs, setTasaCambioBs } = useTasaCambio();
  const { user } = useAuth();
  const { insumos, productos, recetas, ventas, refrescarTodo } = useData();

  // Estado local para Tasa de Cambio
  const [nuevaTasa, setNuevaTasa] = useState<string>(tasaCambioBs.toString());

  // Estado para Datos de Pago Móvil / Transferencias
  const [datosPago, setDatosPago] = useState<DatosPagoMovil>(() => {
    const saved = localStorage.getItem('krumly_config_pagos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      banco: '0102 - Banco de Venezuela',
      cedulaRif: 'V-20123456',
      telefono: '0412-1234567',
      nombreTitular: 'Krumly Repostería C.A.',
      emailZelle: 'pagos@krumly.com',
      notaPago: 'Enviar comprobante de pago por WhatsApp para validar.',
    };
  });

  // Estado para Parámetros de Costeo y Cocina
  const [parametrosCocina, setParametrosCocina] = useState<ParametrosCocina>(() => {
    const saved = localStorage.getItem('krumly_config_cocina');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      margenObjetivoPorcentaje: 45,
      desperdicioEstandarPorcentaje: 3,
      diasCaducidadGalletas: 7,
      stockMinimoGlobal: 10,
    };
  });

  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setNuevaTasa(tasaCambioBs.toString());
  }, [tasaCambioBs]);

  const mostrarMensaje = (texto: string, tipo: 'exito' | 'error' = 'exito') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const handleGuardarTasa = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(nuevaTasa);
    if (isNaN(val) || val <= 0) {
      mostrarMensaje('Ingresa una tasa de cambio válida mayor a 0', 'error');
      return;
    }
    setTasaCambioBs(val);
    mostrarMensaje(`¡Tasa del día actualizada exitosamente a ${val.toFixed(2)} Bs/$!`);
  };

  const handleGuardarPagos = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('krumly_config_pagos', JSON.stringify(datosPago));
    mostrarMensaje('¡Datos de Pago Móvil y Zelle guardados correctamente!');
  };

  const handleGuardarCocina = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('krumly_config_cocina', JSON.stringify(parametrosCocina));
    mostrarMensaje('¡Parámetros de cocina y márgenes objetivo guardados!');
  };

  const handleCopiarDatosPago = () => {
    const texto = `📌 DATOS DE PAGO KRUMLY:\n• Banco: ${datosPago.banco}\n• Cédula/RIF: ${datosPago.cedulaRif}\n• Teléfono: ${datosPago.telefono}\n• Titular: ${datosPago.nombreTitular}\n• Zelle: ${datosPago.emailZelle}\n• Tasa del día: ${tasaCambioBs.toFixed(2)} Bs/$`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    mostrarMensaje('¡Datos de pago copiados al portapapeles para enviar por WhatsApp!');
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleExportarResumen = () => {
    const backupData = {
      fechaExportacion: new Date().toISOString(),
      tasaCambioBs,
      totales: {
        insumos: insumos.length,
        productos: productos.length,
        recetas: recetas.length,
        ventas: ventas.length,
      },
      insumos,
      productos,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krumly-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensaje('¡Copia de respaldo JSON descargada exitosamente!');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Standard Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-krumly-red mb-1">
            <Settings className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Configuración Operativa</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-krumly-chocolate tracking-tight">
            Preferencias del Negocio y Parámetros de Cocina
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Ajuste de tasa de cambio del día, datos rápidos de Pago Móvil/Zelle para clientes en mostrador, métricas de margen objetivo y copias de respaldo.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={handleExportarResumen}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Respaldar Datos (JSON)</span>
          </button>
        </div>
      </div>

      {/* Alerta de notificación */}
      {notificacion && (
        <div
          className={`p-4 rounded-2xl border flex items-center space-x-3 shadow-xs animate-in fade-in duration-200 ${
            notificacion.tipo === 'exito'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <CheckCircle2
            className={`w-5 h-5 shrink-0 ${
              notificacion.tipo === 'exito' ? 'text-emerald-600' : 'text-red-600'
            }`}
          />
          <span className="font-semibold text-xs">{notificacion.texto}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2 cols): Tasa de Cambio + Datos Pago Móvil + Parámetros Cocina */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Tasa de Cambio USD / VES */}
          <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-krumly-border pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-krumly-chocolate">
                    Tasa de Cambio Oficial del Día (USD / VES)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Conversión automática en tiempo real para el Punto de Venta (POS) y Consola Financiera.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleGuardarTasa} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Valor de Tasa del Día (Bs. VES por $1.00 USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-400">Bs.</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={nuevaTasa}
                      onChange={(e) => setNuevaTasa(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-krumly-border rounded-xl text-sm font-bold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red transition-all"
                      placeholder="Ej. 40.50"
                      required
                    />
                  </div>
                </div>

                <div className="sm:self-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-krumly-red hover:bg-krumly-red-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Actualizar Tasa</span>
                  </button>
                </div>
              </div>

              {/* Botones de Acceso Rápido de Tasas */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-gray-400">Acceso rápido:</span>
                {[40.5, 41.0, 42.0, 43.5, 45.0].map((tasaVal) => (
                  <button
                    key={tasaVal}
                    type="button"
                    onClick={() => {
                      setNuevaTasa(tasaVal.toString());
                      setTasaCambioBs(tasaVal);
                      mostrarMensaje(`Tasa fijada en ${tasaVal.toFixed(2)} Bs/$`);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      tasaCambioBs === tasaVal
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {tasaVal.toFixed(2)} Bs
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* 2. Datos Rápidos de Pago Móvil & Cuentas (POS Quick-View) */}
          <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-krumly-border pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-krumly-chocolate">
                    Datos Rápidos de Pago Móvil y Zelle (Mostrador)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Información bancaria para dictar o compartir rápidamente a clientes al cobrar en el POS.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopiarDatosPago}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiado ? '¡Copiado!' : 'Copiar Texto Rápido'}</span>
              </button>
            </div>

            <form onSubmit={handleGuardarPagos} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Banco Destino</label>
                  <input
                    type="text"
                    value={datosPago.banco}
                    onChange={(e) => setDatosPago({ ...datosPago, banco: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cédula o RIF del Titular</label>
                  <input
                    type="text"
                    value={datosPago.cedulaRif}
                    onChange={(e) => setDatosPago({ ...datosPago, cedulaRif: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono Pago Móvil</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={datosPago.telefono}
                      onChange={(e) => setDatosPago({ ...datosPago, telefono: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre o Razon Social Titular</label>
                  <input
                    type="text"
                    value={datosPago.nombreTitular}
                    onChange={(e) => setDatosPago({ ...datosPago, nombreTitular: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Zelle / Zinli / Pay (Opcional)</label>
                <input
                  type="text"
                  value={datosPago.emailZelle}
                  onChange={(e) => setDatosPago({ ...datosPago, emailZelle: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Datos de Pago</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3. Parámetros de Costeo y Cocina */}
          <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-krumly-border pb-3">
              <div className="p-2 rounded-xl bg-red-100 text-krumly-red">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-krumly-chocolate">
                  Parámetros de Costeo, Mezclas y Rendimiento
                </h3>
                <p className="text-[11px] text-gray-500">
                  Alertas de margen de ganancia objetivo y estimación de desperdicio técnico en tazones/amasado.
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardarCocina} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Margen de Ganancia Objetivo Mínimo (%)
                  </label>
                  <div className="relative">
                    <Percent className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={parametrosCocina.margenObjetivoPorcentaje}
                      onChange={(e) =>
                        setParametrosCocina({
                          ...parametrosCocina,
                          margenObjetivoPorcentaje: Number(e.target.value) || 40,
                        })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Los productos por debajo de este % mostrarán alerta preventiva en catálogo.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Estimación Desperdicio Técnico Mezcla (%)
                  </label>
                  <div className="relative">
                    <Percent className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={parametrosCocina.desperdicioEstandarPorcentaje}
                      onChange={(e) =>
                        setParametrosCocina({
                          ...parametrosCocina,
                          desperdicioEstandarPorcentaje: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Masa residual retenida en tazones/mangueras durante la preparación.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Caducidad / Frescura Recomendada (Días)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={parametrosCocina.diasCaducidadGalletas}
                    onChange={(e) =>
                      setParametrosCocina({
                        ...parametrosCocina,
                        diasCaducidadGalletas: Number(e.target.value) || 7,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Umbral Global de Stock Mínimo (Unidades)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={parametrosCocina.stockMinimoGlobal}
                    onChange={(e) =>
                      setParametrosCocina({
                        ...parametrosCocina,
                        stockMinimoGlobal: Number(e.target.value) || 10,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-krumly-border rounded-xl text-xs font-semibold text-krumly-chocolate focus:bg-white focus:outline-none focus:ring-2 focus:ring-krumly-red/20 focus:border-krumly-red"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-krumly-chocolate hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Parámetros de Cocina</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Columna Derecha (1 col): Resumen de Datos + Estado de Servidor */}
        <div className="space-y-6">
          {/* Tarjeta Perfil Usuario Activo */}
          <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-krumly-border pb-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-krumly-chocolate">Usuario y Sesión</h3>
                <p className="text-[11px] text-gray-500">Credenciales de Acceso Administrador.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-krumly-red text-white font-extrabold flex items-center justify-center text-sm">
                  {user?.nombre?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-bold text-krumly-chocolate">{user?.nombre || 'Administrador Krumly'}</p>
                  <p className="text-[11px] text-gray-500">{user?.email || 'admin@krumly.com'}</p>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-gray-600">
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="font-medium">Rol Asignado:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                    {user?.rol || 'ADMINISTRADOR'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="font-medium">Estado de Autenticación:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    JWT ACTIVO
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="font-medium">Almacenamiento Local:</span>
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>IndexedDB Sync</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Respaldo y Base de Datos */}
          <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-krumly-border pb-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-krumly-chocolate">Servidor y Respaldo</h3>
                <p className="text-[11px] text-gray-500">Resguardo de catálogo e inventario.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-gray-700">API Backend NestJS</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  En línea (3000)
                </span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-gray-700">Base de Datos PostgreSQL</span>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Supabase 3NF
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportarResumen}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Respaldo JSON</span>
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-1.5">
                  Genera un archivo JSON comprimido con tus insumos, productos y ventas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
