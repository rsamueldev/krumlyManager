export interface Categoria {
  id: string;
  nombre: string;
  tipo: 'producto' | 'gasto';
  createdAt?: string;
}

import { API_URL, getAuthHeaders } from './api';

export async function fetchCategoriasApi(): Promise<Categoria[]> {
  try {
    const token = localStorage.getItem('krumly_token');
    const res = await fetch(`${API_URL}/categorias`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error al consultar categorías de la API:', err);
  }
  return [];
}

export async function createCategoriaApi(categoria: Omit<Categoria, 'id' | 'createdAt'>): Promise<Categoria> {
  const token = localStorage.getItem('krumly_token');
  const res = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoria),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al guardar la categoría');
  }

  return await res.json();
}

export async function deleteCategoriaApi(id: string): Promise<boolean> {
  const token = localStorage.getItem('krumly_token');
  const res = await fetch(`${API_URL}/categorias/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.ok;
}
