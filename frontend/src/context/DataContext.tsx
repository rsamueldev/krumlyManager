import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Categoria, fetchCategoriasApi } from '../services/categoriasService';
import { fetchInsumosApi, Insumo } from '../services/insumosService';
import { fetchProductosApi, Producto } from '../services/productosService';
import { fetchRecetasApi, Receta } from '../services/recetasService';
import { fetchVentasApi, VentaResponse } from '../services/ventasService';
import { useAuth } from './AuthContext';

interface DataContextType {
  insumos: Insumo[];
  categorias: Categoria[];
  recetas: Receta[];
  productos: Producto[];
  ventas: VentaResponse[];

  cargandoInsumos: boolean;
  cargandoCategorias: boolean;
  cargandoRecetas: boolean;
  cargandoProductos: boolean;
  cargandoVentas: boolean;

  obtenerInsumos: (force?: boolean) => Promise<Insumo[]>;
  obtenerCategorias: (force?: boolean) => Promise<Categoria[]>;
  obtenerRecetas: (force?: boolean) => Promise<Receta[]>;
  obtenerProductos: (force?: boolean) => Promise<Producto[]>;
  obtenerVentas: (force?: boolean) => Promise<VentaResponse[]>;

  refrescarInsumos: () => Promise<void>;
  refrescarCategorias: () => Promise<void>;
  refrescarRecetas: () => Promise<void>;
  refrescarProductos: () => Promise<void>;
  refrescarVentas: () => Promise<void>;
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

  const [cargandoInsumos, setCargandoInsumos] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [cargandoRecetas, setCargandoRecetas] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [cargandoVentas, setCargandoVentas] = useState(false);

  const [lastInsumosFetch, setLastInsumosFetch] = useState<number>(0);
  const [lastCategoriasFetch, setLastCategoriasFetch] = useState<number>(0);
  const [lastRecetasFetch, setLastRecetasFetch] = useState<number>(0);
  const [lastProductosFetch, setLastProductosFetch] = useState<number>(0);
  const [lastVentasFetch, setLastVentasFetch] = useState<number>(0);

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

  // Limpiar caché al cerrar sesión
  useEffect(() => {
    if (!token) {
      setInsumos([]);
      setCategorias([]);
      setRecetas([]);
      setProductos([]);
      setVentas([]);
      setLastInsumosFetch(0);
      setLastCategoriasFetch(0);
      setLastRecetasFetch(0);
      setLastProductosFetch(0);
      setLastVentasFetch(0);
    }
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
      const data = await fetchVentasApi();
      const arrayData = Array.isArray(data) ? data : [];
      setVentas(arrayData);
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

  const refrescarTodo = useCallback(async () => {
    await Promise.all([
      refrescarInsumos(),
      refrescarCategorias(),
      refrescarRecetas(),
      refrescarProductos(),
      refrescarVentas(),
    ]);
  }, [refrescarInsumos, refrescarCategorias, refrescarRecetas, refrescarProductos, refrescarVentas]);

  return (
    <DataContext.Provider
      value={{
        insumos,
        categorias,
        recetas,
        productos,
        ventas,
        cargandoInsumos,
        cargandoCategorias,
        cargandoRecetas,
        cargandoProductos,
        cargandoVentas,
        obtenerInsumos,
        obtenerCategorias,
        obtenerRecetas,
        obtenerProductos,
        obtenerVentas,
        refrescarInsumos,
        refrescarCategorias,
        refrescarRecetas,
        refrescarProductos,
        refrescarVentas,
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
