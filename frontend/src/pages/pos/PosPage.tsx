import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { Producto } from '../../services/productosService';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  DollarSign,
  Smartphone,
  CreditCard,
  Layers,
  CheckCircle2,
  AlertCircle,
  Cookie,
  Coffee,
  GlassWater,
  Package,
  User,
  Sparkles,
} from 'lucide-react';

import { ModalPagoMixto } from './ModalPagoMixto';

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

export type MetodoPagoTipo = 'efectivo_usd' | 'pago_movil' | 'punto' | 'mixto';

export const PosPage: React.FC = () => {
  const { productos, categorias, obtenerProductos, obtenerCategorias, cargandoProductos } = useData();
  const { tasaCambioBs } = useTasaCambio();

  // State Cart & Filters
  const [cart, setCart] = useState<CartItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  
  // Checkout Details State
  const [esPublicoGeneral, setEsPublicoGeneral] = useState(true);
  const [clienteNombre, setClienteNombre] = useState('Público General');
  const [metodoPago, setMetodoPago] = useState<MetodoPagoTipo>('efectivo_usd');
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  useEffect(() => {
    obtenerProductos();
    obtenerCategorias();
  }, [obtenerProductos, obtenerCategorias]);

  // Dynamic Categories filtered for products
  const categoriasProducto = useMemo(() => {
    return categorias.filter((c) => c.tipo === 'producto');
  }, [categorias]);

  // Filter products by category and search term
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria =
        categoriaSeleccionada === 'todas' || p.categoriaId === categoriaSeleccionada;
      return coincideBusqueda && coincideCategoria && p.activo !== false;
    });
  }, [productos, busqueda, categoriaSeleccionada]);

  // Cart Handlers
  const agregarAlCarrito = (prod: Producto) => {
    if (prod.stockActual <= 0) return;

    setCart((prevCart) => {
      const idx = prevCart.findIndex((item) => item.producto.id === prod.id);
      if (idx >= 0) {
        const itemActual = prevCart[idx];
        if (itemActual.cantidad >= prod.stockActual) {
          return prevCart; // Reached max stock available
        }
        const newCart = [...prevCart];
        newCart[idx] = { ...itemActual, cantidad: itemActual.cantidad + 1 };
        return newCart;
      }
      return [...prevCart, { producto: prod, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (productoId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.producto.id === productoId) {
            const nuevaCant = item.cantidad + delta;
            if (nuevaCant <= 0) return null;
            if (nuevaCant > item.producto.stockActual) return item;
            return { ...item, cantidad: nuevaCant };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const eliminarDelCarrito = (productoId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.producto.id !== productoId));
  };

  const vaciarCarrito = () => {
    setCart([]);
  };

  // Cart Total Calculations
  const totalUSD = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.producto.precioVenta * item.cantidad, 0);
  }, [cart]);

  const totalVES = useMemo(() => {
    return totalUSD * tasaCambioBs;
  }, [totalUSD, tasaCambioBs]);

  const handleConfirmarVenta = () => {
    if (cart.length === 0) return;
    setModalPagoAbierto(true);
  };

  const handleVentaCompletada = (codigoVenta: string, total: number) => {
    setModalPagoAbierto(false);
    setCart([]);
    setNotificacion(`¡Venta ${codigoVenta} registrada exitosamente por $${total.toFixed(2)} USD!`);
    setTimeout(() => {
      setNotificacion(null);
    }, 4500);
  };

  // Helper for dynamic product images/icons
  const getProductIcon = (nombre: string) => {
    const nameLower = nombre.toLowerCase();
    if (nameLower.includes('torta') || nameLower.includes('pastel')) {
      return <Cookie className="w-14 h-14 text-amber-600/70" />;
    }
    if (nameLower.includes('jugo') || nameLower.includes('bebida') || nameLower.includes('refresco')) {
      return <GlassWater className="w-14 h-14 text-blue-500/70" />;
    }
    if (nameLower.includes('café') || nameLower.includes('espresso')) {
      return <Coffee className="w-14 h-14 text-amber-800/70" />;
    }
    return <Cookie className="w-14 h-14 text-krumly-red/70" />;
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Alerta de Venta */}
      {notificacion && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center space-x-2 animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-xs">{notificacion}</span>
        </div>
      )}

      {/* Main Grid: Left Catalog + Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL IZQUIERDO: Catálogo y Filtros (8 Cols en LG) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Header Superior del POS: Status & Caja */}
          <div className="bg-white/80 backdrop-blur-xs p-3 px-4 rounded-2xl border border-krumly-border flex justify-between items-center shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="font-heading font-bold text-xs text-krumly-chocolate">Admin</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Online
              </span>
            </div>
            <div className="px-3 py-1 bg-krumly-cream/60 rounded-xl text-[11px] font-bold text-krumly-chocolate border border-krumly-border">
              Caja 01
            </div>
          </div>

          {/* Input de Búsqueda */}
          <div className="relative">
            <Search className="w-4.5 h-4.5 text-gray-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-krumly-border rounded-2xl text-xs font-semibold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none shadow-2xs placeholder-gray-400"
            />
          </div>

          {/* Pills de Categorías */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategoriaSeleccionada('todas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                categoriaSeleccionada === 'todas'
                  ? 'bg-krumly-red text-white shadow-md shadow-krumly-red/20'
                  : 'bg-white text-krumly-chocolate border border-krumly-border hover:bg-amber-50/50'
              }`}
            >
              Todas
            </button>

            {categoriasProducto.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  categoriaSeleccionada === cat.id
                    ? 'bg-krumly-red text-white shadow-md shadow-krumly-red/20'
                    : 'bg-white text-krumly-chocolate border border-krumly-border hover:bg-amber-50/50'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Grid de Productos */}
          {cargandoProductos ? (
            <div className="bg-white p-12 rounded-2xl border border-krumly-border text-center text-xs text-gray-400 font-medium">
              Cargando productos del punto de venta...
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-krumly-border text-center text-xs text-gray-400 font-medium space-y-2">
              <Package className="w-8 h-8 text-gray-300 mx-auto" />
              <p>No se encontraron productos en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {productosFiltrados.map((prod) => {
                const itemEnCarrito = cart.find((i) => i.producto.id === prod.id);
                const cantidadActualEnCart = itemEnCarrito ? itemEnCarrito.cantidad : 0;
                const stockDisponible = prod.stockActual - cantidadActualEnCart;
                const esAgotado = prod.stockActual <= 0 || stockDisponible <= 0;

                // Stock badges formatting
                let stockBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                let stockBadgeText = `Stock: ${prod.stockActual}`;

                if (prod.stockActual <= 0) {
                  stockBadgeClass = 'bg-rose-100 text-rose-700 border-rose-200';
                  stockBadgeText = 'Agotado';
                } else if (prod.stockActual <= (prod.stockMinimo || 5)) {
                  stockBadgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                  stockBadgeText = `Stock Bajo: ${prod.stockActual}`;
                }

                return (
                  <div
                    key={prod.id}
                    className={`bg-white rounded-2xl border border-krumly-border p-3.5 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-md ${
                      esAgotado ? 'opacity-65' : ''
                    }`}
                  >
                    {/* Imagen / Iluminación del Producto */}
                    <div className="w-full h-28 rounded-xl bg-[#FFF9F5] border border-amber-100/60 flex items-center justify-center mb-3 relative overflow-hidden group">
                      {getProductIcon(prod.nombre)}
                    </div>

                    {/* Información Principal */}
                    <div className="space-y-1 mb-3">
                      <h4 className="font-bold text-xs text-krumly-chocolate leading-snug line-clamp-2">
                        {prod.nombre}
                      </h4>
                      <p className="font-extrabold text-sm text-krumly-chocolate">
                        ${prod.precioVenta.toFixed(2)}
                      </p>
                    </div>

                    {/* Fila Inferior: Stock Badge + Botón '+' */}
                    <div className="flex items-center justify-between pt-2 border-t border-krumly-border/40">
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${stockBadgeClass}`}
                      >
                        {stockBadgeText}
                      </span>

                      <button
                        type="button"
                        onClick={() => agregarAlCarrito(prod)}
                        disabled={esAgotado}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          esAgotado
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-krumly-cream hover:bg-krumly-red hover:text-white text-krumly-red border border-krumly-border'
                        }`}
                        title={esAgotado ? 'Sin stock disponible' : 'Agregar al carrito'}
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PANEL DERECHO: Carrito de Compras & Cobro (4 Cols en LG) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-krumly-border p-5 shadow-xs space-y-5">
          
          {/* Header Carrito */}
          <div className="flex items-center justify-between border-b border-krumly-border pb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-krumly-red" />
              <h3 className="font-heading font-bold text-base text-krumly-chocolate">Carrito</h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={vaciarCarrito}
                className="text-gray-400 hover:text-krumly-red p-1 rounded-lg transition-colors cursor-pointer"
                title="Vaciar carrito"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {/* Lista de Ítems en el Carrito */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 divide-y divide-krumly-border/50">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400 font-medium space-y-2">
                <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto stroke-1" />
                <p>El carrito está vacío.</p>
                <p className="text-[11px] text-gray-400">Haz clic en el "+" de un producto para agregarlo.</p>
              </div>
            ) : (
              cart.map((item) => {
                const subtotal = item.producto.precioVenta * item.cantidad;
                return (
                  <div key={item.producto.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-krumly-chocolate leading-tight">
                        {item.producto.nombre}
                      </h4>
                      <span className="font-extrabold text-xs text-krumly-chocolate">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Selector de Cantidad */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 bg-krumly-cream/50 p-1 rounded-xl border border-krumly-border">
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.producto.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-krumly-chocolate hover:text-krumly-red flex items-center justify-center font-bold text-xs shadow-2xs border border-krumly-border/60 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs px-2 text-krumly-chocolate">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.producto.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white text-krumly-chocolate hover:text-krumly-red flex items-center justify-center font-bold text-xs shadow-2xs border border-krumly-border/60 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarDelCarrito(item.producto.id)}
                        className="text-gray-300 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* SECCIÓN CLIENTE */}
          <div className="space-y-2 pt-3 border-t border-krumly-border">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                Cliente
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-bold text-krumly-chocolate">
                <input
                  type="checkbox"
                  checked={esPublicoGeneral}
                  onChange={(e) => {
                    setEsPublicoGeneral(e.target.checked);
                    if (e.target.checked) setClienteNombre('Público General');
                  }}
                  className="rounded text-krumly-red focus:ring-krumly-red"
                />
                <span>Público General</span>
              </label>
            </div>

            <select
              disabled={esPublicoGeneral}
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="w-full px-3.5 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none disabled:opacity-60 cursor-pointer"
            >
              <option value="Público General">Público General</option>
            </select>
          </div>

          {/* SECCIÓN MÉTODO DE PAGO */}
          <div className="space-y-2 pt-3 border-t border-krumly-border">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 block">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'efectivo_usd', label: 'Efectivo USD', icon: DollarSign },
                { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone },
                { id: 'punto', label: 'Punto', icon: CreditCard },
                { id: 'mixto', label: 'Mixto', icon: Layers },
              ].map((method) => {
                const Icon = method.icon;
                const selected = metodoPago === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setMetodoPago(method.id as MetodoPagoTipo)}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selected
                        ? 'bg-red-50/60 border-krumly-red text-krumly-red shadow-2xs'
                        : 'bg-white border-krumly-border text-gray-600 hover:border-amber-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TOTAL A PAGAR */}
          <div className="pt-3 border-t border-krumly-border space-y-1">
            <span className="text-[11px] font-medium text-gray-500 block">Total a pagar</span>
            <div className="flex justify-between items-baseline">
              <span className="font-heading font-extrabold text-2xl text-krumly-chocolate">
                ${totalUSD.toFixed(2)}{' '}
                <span className="text-xs font-bold text-gray-400">USD</span>
              </span>
              <span className="text-xs font-bold text-gray-500">
                ({totalVES.toFixed(2)} Bs)
              </span>
            </div>
          </div>

          {/* BOTÓN CONFIRMAR VENTA */}
          <button
            type="button"
            onClick={handleConfirmarVenta}
            disabled={cart.length === 0}
            className={`w-full font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer ${
              cart.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-krumly-red hover:bg-krumly-red-dark text-white shadow-krumly-red/20'
            }`}
          >
            <span>Confirmar Venta (${totalUSD.toFixed(2)} USD)</span>
          </button>
        </div>
      </div>

      {/* Modal de Cobro & Pago Mixto */}
      {modalPagoAbierto && (
        <ModalPagoMixto
          cart={cart}
          clienteNombre={clienteNombre}
          onClose={() => setModalPagoAbierto(false)}
          onVentaCompletada={handleVentaCompletada}
        />
      )}
    </div>
  );
};
