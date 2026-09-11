import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Categoria, fetchCategoriasApi } from '../services/categoriasService';
import { fetchInsumosApi, Insumo } from '../services/insumosService';
import { fetchProductosApi, Producto } from '../services/productosService';
import { fetchRecetasApi, Receta } from '../services/recetasService';
import { useAuth } from './AuthContext';

interface DataContextType {
  insumos: Insumo[];
  categorias: Categoria[];
  recetas: Receta[];
  productos: Producto[];

  cargandoInsumos: boolean;
  cargandoCategorias: boolean;
  cargandoRecetas: boolean;
  cargandoProductos: boolean;

  obtenerInsumos: (force?: boolean) => Promise<Insumo[]>;
  obtenerCategorias: (force?: boolean) => Promise<Categoria[]>;
  obtenerRecetas: (force?: boolean) => Promise<Receta[]>;
  obtenerProductos: (force?: boolean) => Promise<Producto[]>;

  refrescarInsumos: () => Promise<void>;
  refrescarCategorias: () => Promise<void>;
  refrescarRecetas: () => Promise<void>;
  refrescarProductos: () => Promise<void>;
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

  const [cargandoInsumos, setCargandoInsumos] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [cargandoRecetas, setCargandoRecetas] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  const [lastInsumosFetch, setLastInsumosFetch] = useState<number>(0);
  const [lastCategoriasFetch, setLastCategoriasFetch] = useState<number>(0);
  const [lastRecetasFetch, setLastRecetasFetch] = useState<number>(0);
  const [lastProductosFetch, setLastProductosFetch] = useState<number>(0);

  // Limpiar caché al cerrar sesión
  useEffect(() => {
    if (!token) {
      setInsumos([]);
      setCategorias([]);
      setRecetas([]);
      setProductos([]);
      setLastInsumosFetch(0);
      setLastCategoriasFetch(0);
      setLastRecetasFetch(0);
      setLastProductosFetch(0);
    }
  }, [token]);

  const refrescarInsumos = useCallback(async () => {
    if (!token) return;
    setCargandoInsumos(insumos.length === 0);
    try {
      const data = await fetchInsumosApi();
      setInsumos(data || []);
      setLastInsumosFetch(Date.now());
    } finally {
      setCargandoInsumos(false);
    }
  }, [token, insumos.length]);

  const obtenerInsumos = useCallback(
    async (force: boolean = false): Promise<Insumo[]> => {
      const now = Date.now();
      const isStale = now - lastInsumosFetch > STALE_TIME_MS;

      if (insumos.length === 0 || force) {
        await refrescarInsumos();
      } else if (isStale) {
        refrescarInsumos(); // Fondo silencioso SWR
      }
      return insumos;
    },
    [insumos, lastInsumosFetch, refrescarInsumos]
  );

  const refrescarCategorias = useCallback(async () => {
    if (!token) return;
    setCargandoCategorias(categorias.length === 0);
    try {
      const data = await fetchCategoriasApi();
      setCategorias(data || []);
      setLastCategoriasFetch(Date.now());
    } finally {
      setCargandoCategorias(false);
    }
  }, [token, categorias.length]);

  const obtenerCategorias = useCallback(
    async (force: boolean = false): Promise<Categoria[]> => {
      const now = Date.now();
      const isStale = now - lastCategoriasFetch > STALE_TIME_MS;

      if (categorias.length === 0 || force) {
        await refrescarCategorias();
      } else if (isStale) {
        refrescarCategorias(); // Fondo silencioso SWR
      }
      return categorias;
    },
    [categorias, lastCategoriasFetch, refrescarCategorias]
  );

  const refrescarRecetas = useCallback(async () => {
    if (!token) return;
    setCargandoRecetas(recetas.length === 0);
    try {
      const data = await fetchRecetasApi();
      setRecetas(data || []);
      setLastRecetasFetch(Date.now());
    } finally {
      setCargandoRecetas(false);
    }
  }, [token, recetas.length]);

  const obtenerRecetas = useCallback(
    async (force: boolean = false): Promise<Receta[]> => {
      const now = Date.now();
      const isStale = now - lastRecetasFetch > STALE_TIME_MS;

      if (recetas.length === 0 || force) {
        await refrescarRecetas();
      } else if (isStale) {
        refrescarRecetas(); // Fondo silencioso SWR
      }
      return recetas;
    },
    [recetas, lastRecetasFetch, refrescarRecetas]
  );

  const refrescarProductos = useCallback(async () => {
    if (!token) return;
    setCargandoProductos(productos.length === 0);
    try {
      const data = await fetchProductosApi();

      const mapUnicos = new Map<string, Producto>();
      (data || []).forEach((p) => {
        if (p && p.id) mapUnicos.set(p.id, p);
      });
      setProductos(Array.from(mapUnicos.values()));
      setLastProductosFetch(Date.now());
    } finally {
      setCargandoProductos(false);
    }
  }, [token, productos.length]);

  const obtenerProductos = useCallback(
    async (force: boolean = false): Promise<Producto[]> => {
      const now = Date.now();
      const isStale = now - lastProductosFetch > STALE_TIME_MS;

      if (productos.length === 0 || force) {
        await refrescarProductos();
      } else if (isStale) {
        refrescarProductos(); // Fondo silencioso SWR
      }
      return productos;
    },
    [productos, lastProductosFetch, refrescarProductos]
  );

  const refrescarTodo = useCallback(async () => {
    await Promise.all([
      refrescarInsumos(),
      refrescarCategorias(),
      refrescarRecetas(),
      refrescarProductos(),
    ]);
  }, [refrescarInsumos, refrescarCategorias, refrescarRecetas, refrescarProductos]);

  return (
    <DataContext.Provider
      value={{
        insumos,
        categorias,
        recetas,
        productos,
        cargandoInsumos,
        cargandoCategorias,
        cargandoRecetas,
        cargandoProductos,
        obtenerInsumos,
        obtenerCategorias,
        obtenerRecetas,
        obtenerProductos,
        refrescarInsumos,
        refrescarCategorias,
        refrescarRecetas,
        refrescarProductos,
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
