import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Categoria, fetchCategoriasApi } from '../services/categoriasService';
import { fetchInsumosApi, Insumo } from '../services/insumosService';
import { fetchProductosApi, Producto } from '../services/productosService';
import { fetchRecetasApi, Receta } from '../services/recetasService';
import { fetchVentasApi, VentaResponse } from '../services/ventasService';
import { Cliente, fetchClientesApi } from '../services/clientesService';
import { ejecutarSincronizacionOffline } from '../services/offlineSyncService';
import { obtenerVentasOffline } from '../services/offlineStorage';
import { useAuth } from './AuthContext';

interface DataContextType {
  insumos: Insumo[];
  categorias: Categoria[];
  recetas: Receta[];
  productos: Producto[];
  ventas: VentaResponse[];
  clientes: Cliente[];

  cargandoInsumos: boolean;
  cargandoCategorias: boolean;
  cargandoRecetas: boolean;
  cargandoProductos: boolean;
  cargandoVentas: boolean;
  cargandoClientes: boolean;

  obtenerInsumos: (force?: boolean) => Promise<Insumo[]>;
  obtenerCategorias: (force?: boolean) => Promise<Categoria[]>;
  obtenerRecetas: (force?: boolean) => Promise<Receta[]>;
  obtenerProductos: (force?: boolean) => Promise<Producto[]>;
  obtenerVentas: (force?: boolean) => Promise<VentaResponse[]>;
  obtenerClientes: (force?: boolean) => Promise<Cliente[]>;

  refrescarInsumos: () => Promise<void>;
  refrescarCategorias: () => Promise<void>;
  refrescarRecetas: () => Promise<void>;
  refrescarProductos: () => Promise<void>;
  refrescarVentas: () => Promise<void>;
  refrescarClientes: () => Promise<void>;
  refrescarTodo: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STALE_TIME_MS = 60 * 1000; // 60 segundos de validez de caché

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<VentaResponse[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [cargandoInsumos, setCargandoInsumos] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [cargandoRecetas, setCargandoRecetas] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  const [lastInsumosFetch, setLastInsumosFetch] = useState<number>(0);
  const [lastCategoriasFetch, setLastCategoriasFetch] = useState<number>(0);
  const [lastRecetasFetch, setLastRecetasFetch] = useState<number>(0);
  const [lastProductosFetch, setLastProductosFetch] = useState<number>(0);
  const [lastVentasFetch, setLastVentasFetch] = useState<number>(0);
  const [lastClientesFetch, setLastClientesFetch] = useState<number>(0);

  // Refs para mantener estabilidad de callbacks y evitar bucles infinitos de re-renderizado
  const insumosRef = useRef(insumos);
  insumosRef.current = insumos;
  const lastInsumosFetchRef = useRef(lastInsumosFetch);
  lastInsumosFetchRef.current = lastInsumosFetch;

  const categoriasRef = useRef(categorias);
  categoriasRef.current = categorias;
  const lastCategoriasFetchRef = useRef(lastCategoriasFetch);
  lastCategoriasFetchRef.current = lastCategoriasFetch;

  const recetasRef = useRef(recetas);
  recetasRef.current = recetas;
  const lastRecetasFetchRef = useRef(lastRecetasFetch);
  lastRecetasFetchRef.current = lastRecetasFetch;

  const productosRef = useRef(productos);
  productosRef.current = productos;
  const lastProductosFetchRef = useRef(lastProductosFetch);
  lastProductosFetchRef.current = lastProductosFetch;

  const ventasRef = useRef(ventas);
  ventasRef.current = ventas;
  const lastVentasFetchRef = useRef(lastVentasFetch);
  lastVentasFetchRef.current = lastVentasFetch;

  const clientesRef = useRef(clientes);
  clientesRef.current = clientes;
  const lastClientesFetchRef = useRef(lastClientesFetch);
  lastClientesFetchRef.current = lastClientesFetch;

  // Limpiar caché al cerrar sesión
  useEffect(() => {
    if (!token) {
      setInsumos([]);
      setCategorias([]);
      setRecetas([]);
      setProductos([]);
      setVentas([]);
      setClientes([]);
      setLastInsumosFetch(0);
      setLastCategoriasFetch(0);
      setLastRecetasFetch(0);
      setLastProductosFetch(0);
      setLastVentasFetch(0);
      setLastClientesFetch(0);
    }
  }, [token]);

  // Sincronizador automático continuo de ventas offline al reconectarse a internet
  useEffect(() => {
    const intentarSincronizacion = async () => {
      if (!token || !navigator.onLine) return;
      const sincronizadasCount = await ejecutarSincronizacionOffline();
      if (sincronizadasCount > 0) {
        await Promise.all([refrescarVentas(), refrescarProductos()]);
      }
    };

    intentarSincronizacion();

    // Reintento periódico cada 10 segundos para garantizar sincronización si la red estuvo inestable
    const interval = setInterval(() => {
      intentarSincronizacion();
    }, 10000);

    const handleOnlineOrFocus = () => {
      intentarSincronizacion();
    };

    window.addEventListener('online', handleOnlineOrFocus);
    window.addEventListener('focus', handleOnlineOrFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnlineOrFocus);
      window.removeEventListener('focus', handleOnlineOrFocus);
    };
  }, [token]);

  // 1. INSUMOS
  const refrescarInsumos = useCallback(async () => {
    if (!token) return;
    setCargandoInsumos(insumosRef.current.length === 0);
    try {
      const data = await fetchInsumosApi();
      const arrayData = Array.isArray(data) ? data : [];
      setInsumos(arrayData);
      const now = Date.now();
      setLastInsumosFetch(now);
      lastInsumosFetchRef.current = now;
    } finally {
      setCargandoInsumos(false);
    }
  }, [token]);

  const obtenerInsumos = useCallback(
    async (force: boolean = false): Promise<Insumo[]> => {
      const now = Date.now();
      const lastFetch = lastInsumosFetchRef.current;
      const isStale = now - lastFetch > STALE_TIME_MS;

      if (lastFetch === 0 || force) {
        await refrescarInsumos();
      } else if (isStale) {
        refrescarInsumos();
      }
      return insumosRef.current;
    },
    [refrescarInsumos]
  );

  // 2. CATEGORÍAS
  const refrescarCategorias = useCallback(async () => {
    if (!token) return;
    setCargandoCategorias(categoriasRef.current.length === 0);
    try {
      const data = await fetchCategoriasApi();
      const arrayData = Array.isArray(data) ? data : [];
      setCategorias(arrayData);
      const now = Date.now();
      setLastCategoriasFetch(now);
      lastCategoriasFetchRef.current = now;
    } finally {
      setCargandoCategorias(false);
    }
  }, [token]);

  const obtenerCategorias = useCallback(
    async (force: boolean = false): Promise<Categoria[]> => {
      const now = Date.now();
      const lastFetch = lastCategoriasFetchRef.current;
      const isStale = now - lastFetch > STALE_TIME_MS;

      if (lastFetch === 0 || force) {
        await refrescarCategorias();
      } else if (isStale) {
        refrescarCategorias();
      }
      return categoriasRef.current;
    },
    [refrescarCategorias]
  );

  // 3. RECETAS
  const refrescarRecetas = useCallback(async () => {
    if (!token) return;
    setCargandoRecetas(recetasRef.current.length === 0);
    try {
      const data = await fetchRecetasApi();
      const arrayData = Array.isArray(data) ? data : [];
      setRecetas(arrayData);
      const now = Date.now();
      setLastRecetasFetch(now);
      lastRecetasFetchRef.current = now;
    } finally {
      setCargandoRecetas(false);
    }
  }, [token]);

  const obtenerRecetas = useCallback(
    async (force: boolean = false): Promise<Receta[]> => {
      const now = Date.now();
      const lastFetch = lastRecetasFetchRef.current;
      const isStale = now - lastFetch > STALE_TIME_MS;

      if (lastFetch === 0 || force) {
        await refrescarRecetas();
      } else if (isStale) {
        refrescarRecetas();
      }
      return recetasRef.current;
    },
    [refrescarRecetas]
  );

  // 4. PRODUCTOS
  const refrescarProductos = useCallback(async () => {
    if (!token) return;
    setCargandoProductos(productosRef.current.length === 0);
    try {
      const data = await fetchProductosApi();
      const mapUnicos = new Map<string, Producto>();
      (Array.isArray(data) ? data : []).forEach((p) => {
        if (p && p.id) mapUnicos.set(p.id, p);
      });
      const listaUnica = Array.from(mapUnicos.values());
      setProductos(listaUnica);
      const now = Date.now();
      setLastProductosFetch(now);
      lastProductosFetchRef.current = now;
    } finally {
      setCargandoProductos(false);
    }
  }, [token]);

  const obtenerProductos = useCallback(
    async (force: boolean = false): Promise<Producto[]> => {
      const now = Date.now();
      const lastFetch = lastProductosFetchRef.current;
      const isStale = now - lastFetch > STALE_TIME_MS;

      if (lastFetch === 0 || force) {
        await refrescarProductos();
      } else if (isStale) {
        refrescarProductos();
      }
      return productosRef.current;
    },
    [refrescarProductos]
  );

  // 5. VENTAS
  const refrescarVentas = useCallback(async () => {
    if (!token) return;
    setCargandoVentas(ventasRef.current.length === 0);
    try {
      if (navigator.onLine) {
        await ejecutarSincronizacionOffline().catch(() => 0);
      }

      const data = await fetchVentasApi();
      const onlineList = Array.isArray(data) ? data : [];

      let offlineList: VentaResponse[] = [];
      try {
        const offlineRecords = await obtenerVentasOffline();
        const onlineCodigos = new Set(onlineList.map((v) => v.codigoVenta));

        offlineList = offlineRecords
          .filter((rec) => !onlineCodigos.has(rec.codigoTemp))
          .map((rec) => ({
            id: rec.id,
            codigoVenta: rec.codigoTemp,
            fechaVenta: new Date(rec.timestamp).toISOString(),
            totalVenta: rec.payload.totalVenta,
            estadoSincronizacion: 'offline_pending',
            cliente: rec.payload.clienteId ? { id: rec.payload.clienteId, nombre: 'Cliente' } : { id: 'pg', nombre: 'Público General' },
            detalles: rec.payload.detalles || [],
            pagos: rec.payload.pagos || [],
          }));
      } catch (err) {
        console.warn('Error al leer ventas pendientes de IndexedDB:', err);
      }

      const listaCombinada = [...offlineList, ...onlineList];
      setVentas(listaCombinada);
      ventasRef.current = listaCombinada;
      const now = Date.now();
      setLastVentasFetch(now);
      lastVentasFetchRef.current = now;
    } finally {
      setCargandoVentas(false);
    }
  }, [token]);

  const obtenerVentas = useCallback(
    async (force: boolean = false): Promise<VentaResponse[]> => {
      const now = Date.now();
      const lastFetch = lastVentasFetchRef.current;
      const isStale = now - lastFetch > STALE_TIME_MS;

      if (lastFetch === 0 || force) {
        await refrescarVentas();
      } else if (isStale) {
        refrescarVentas();
      }
      return ventasRef.current;
    },
    [refrescarVentas]
  );

  // 6. CLIENTES
  const refrescarClientes = useCallback(async () => {
    if (!token) return;
    setCargandoClientes(clientesRef.current.length === 0);
    try {
      const data = await fetchClientesApi();
      const arrayData = Array.isArray(data) ? data : [];
      setClientes(arrayData);
      const now = Date.now();
      setLastClientesFetch(now);
      lastClientesFetchRef.current = now;
    } finally {
      setCargandoClientes(false);
    }
  }, [token]);

  const obtenerClientes = useCallback(
    async (force: boolean = false): Promise<Cliente[]> => {
      const now = Date.now();
      const lastFetch = lastClientesFetchRef.current;
      const isStale = now - lastFetch > STALE_TIME_MS;

      if (lastFetch === 0 || force) {
        await refrescarClientes();
      } else if (isStale) {
        refrescarClientes();
      }
      return clientesRef.current;
    },
    [refrescarClientes]
  );

  const refrescarTodo = useCallback(async () => {
    await Promise.all([
      refrescarInsumos(),
      refrescarCategorias(),
      refrescarRecetas(),
      refrescarProductos(),
      refrescarVentas(),
      refrescarClientes(),
    ]);
  }, [refrescarInsumos, refrescarCategorias, refrescarRecetas, refrescarProductos, refrescarVentas, refrescarClientes]);

  return (
    <DataContext.Provider
      value={{
        insumos,
        categorias,
        recetas,
        productos,
        ventas,
        clientes,
        cargandoInsumos,
        cargandoCategorias,
        cargandoRecetas,
        cargandoProductos,
        cargandoVentas,
        cargandoClientes,
        obtenerInsumos,
        obtenerCategorias,
        obtenerRecetas,
        obtenerProductos,
        obtenerVentas,
        obtenerClientes,
        refrescarInsumos,
        refrescarCategorias,
        refrescarRecetas,
        refrescarProductos,
        refrescarVentas,
        refrescarClientes,
        refrescarTodo,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe usarse dentro de un DataProvider');
  }
  return context;
};
