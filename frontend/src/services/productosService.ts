import { API_URL, getAuthHeaders } from './api';
import { InsumoItem } from './recetasService';

export interface ProductoInsumoAdicional {
  id?: string;
  productoId?: string;
  insumoId: string;
  cantidad: number;
  costoCalculado?: number;
  insumo?: InsumoItem;
}

export interface Producto {
  id: string;
  nombre: string;
  categoriaId?: string;
  recetaId?: string;
  pesoMasaGramos: number;
  costoMasaUnidad: number;
  costoInsumosAdicionales: number;
  costoEmpaque: number;
  costoManoObra: number;
  costoDepreciacion: number;
  porcentajeDesperdicio: number;
  costoDirectoTotal: number;
  precioVenta: number;
  margenGananciaPorcentaje: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  categoria?: { id: string; nombre: string; tipo: string };
  receta?: { id: string; nombre: string; costoPorGramo: number; pesoTotalMezclaGramos: number };
  insumosAdicionales?: ProductoInsumoAdicional[];
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchProductosApi(): Promise<Producto[]> {
  try {
    const res = await fetch(`${API_URL}/productos`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error al consultar productos de la API:', err);
  }
  return [];
}

export async function createProductoApi(producto: Partial<Producto>): Promise<Producto> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(producto),
    });
  } catch (err: any) {
    throw new Error('No se pudo conectar con el servidor NestJS (Backend). Verifica que la API esté encendida.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('Sesión no autorizada o token expirado. Por favor inicia sesión nuevamente.');
    }
    if (res.status === 403) {
      throw new Error('No tienes permisos suficientes para registrar productos.');
    }
    throw new Error(errData.message || `Error del servidor (${res.status}) al guardar el producto`);
  }

  return await res.json();
}

export async function updateProductoApi(id: string, producto: Partial<Producto>): Promise<Producto> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(producto),
    });
  } catch (err: any) {
    throw new Error('No se pudo conectar con el servidor NestJS (Backend). Verifica que la API esté encendida.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('Sesión no autorizada o token expirado. Por favor inicia sesión nuevamente.');
    }
    if (res.status === 403) {
      throw new Error('No tienes permisos suficientes para actualizar productos.');
    }
    throw new Error(errData.message || `Error del servidor (${res.status}) al actualizar el producto`);
  }

  return await res.json();
}

export async function deleteProductoApi(id: string): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  } catch (err: any) {
    throw new Error('No se pudo conectar con el servidor NestJS (Backend).');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al eliminar el producto de la base de datos');
  }

  return true;
}
