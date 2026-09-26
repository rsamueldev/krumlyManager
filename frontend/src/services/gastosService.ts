import { API_URL, getAuthHeaders, handleUnauthorized } from './api';

export type TipoGasto = 'fijo' | 'variable';

export interface Gasto {
  id: string;
  tipoGasto: TipoGasto;
  concepto: string;
  montoUsd: number;
  montoVes?: number | null;
  tasaCambio?: number | null;
  metodoPago?: string | null;
  fechaGasto: string;
  categoriaId?: string | null;
  usuarioId?: string | null;
  categoria?: {
    id: string;
    nombre: string;
    tipo: string;
  } | null;
  usuario?: {
    id: string;
    username: string;
  } | null;
  createdAt?: string;
}

export interface RegistrarGastoDto {
  tipoGasto: TipoGasto;
  concepto: string;
  montoUsd: number;
  montoVes?: number;
  tasaCambio?: number;
  metodoPago?: string;
  fechaGasto?: string;
  categoriaId?: string;
}

export async function fetchGastosApi(): Promise<Gasto[]> {
  try {
    const res = await fetch(`${API_URL}/gastos`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) handleUnauthorized(res);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error al consultar gastos de la API:', err);
  }
  return [];
}

export async function createGastoApi(dto: RegistrarGastoDto): Promise<Gasto> {
  const res = await fetch(`${API_URL}/gastos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (res.status === 401) handleUnauthorized(res);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Error al registrar el gasto';
    throw new Error(message);
  }

  return await res.json();
}

export async function deleteGastoApi(id: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/gastos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (res.status === 401) handleUnauthorized(res);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al eliminar el gasto');
  }

  return true;
}
