export interface Insumo {
  id: string;
  nombre: string;
  unidadMedida: 'gramos' | 'ml' | 'unidades';
  cantidadEmpaque: number;
  precioCompra: number;
  costoUnitario: number;
  stockActual: number;
  stockMinimo: number;
  createdAt?: string;
  updatedAt?: string;
}

import { API_URL, getAuthHeaders } from './api';

export async function fetchInsumosApi(): Promise<Insumo[]> {
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
    console.error('Error al consultar insumos de la API:', err);
  }
  return [];
}

export async function createInsumoApi(insumo: Omit<Insumo, 'id' | 'costoUnitario' | 'createdAt' | 'updatedAt'>): Promise<Insumo> {
  const token = localStorage.getItem('krumly_token');
  const res = await fetch(`${API_URL}/insumos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(insumo),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al guardar el insumo en el servidor');
  }

  return await res.json();
}

export async function updateInsumoApi(id: string, insumo: Partial<Insumo>): Promise<Insumo> {
  const token = localStorage.getItem('krumly_token');
  const res = await fetch(`${API_URL}/insumos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(insumo),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al actualizar el insumo');
  }

  return await res.json();
}

export async function deleteInsumoApi(id: string): Promise<boolean> {
  const token = localStorage.getItem('krumly_token');
  const res = await fetch(`${API_URL}/insumos/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Error al eliminar el insumo de la base de datos');
  }

  return true;
}
