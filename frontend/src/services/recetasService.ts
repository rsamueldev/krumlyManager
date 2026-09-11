export interface InsumoItem {
  id: string;
  nombre: string;
  unidadMedida: string;
  costoUnitario: number;
}

export interface RecetaInsumoItem {
  id?: string;
  insumoId: string;
  cantidad: number;
  costoCalculado?: number;
  insumo?: InsumoItem;
}

export interface Receta {
  id: string;
  nombre: string;
  pesoTotalMezclaGramos: number;
  costoTotalLote: number;
  costoPorGramo: number;
  insumos: RecetaInsumoItem[];
  createdAt?: string;
  updatedAt?: string;
}

import { API_URL, getAuthHeaders } from './api';

export async function fetchInsumosApi(): Promise<InsumoItem[]> {
  try {
    const token = localStorage.getItem('krumly_token');
    const res = await fetch(`${API_URL}/insumos`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error al conectar con la API de insumos:', err);
  }
  return [];
}

export async function fetchRecetasApi(): Promise<Receta[]> {
  try {
    const token = localStorage.getItem('krumly_token');
    const res = await fetch(`${API_URL}/recetas`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error al conectar con la API de recetas:', err);
  }
  return [];
}

export async function saveRecetaApi(receta: Partial<Receta>): Promise<Receta> {
  const token = localStorage.getItem('krumly_token');
  const isEdit = Boolean(receta.id);
  const url = isEdit ? `${API_URL}/recetas/${receta.id}` : `${API_URL}/recetas`;
  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify({
      nombre: receta.nombre,
      pesoTotalMezclaGramos: receta.pesoTotalMezclaGramos,
      insumos: receta.insumos?.map((i) => ({
        insumoId: i.insumoId,
        cantidad: i.cantidad,
      })),
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al guardar la receta en la base de datos');
  }

  return await res.json();
}
