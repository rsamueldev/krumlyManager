import { API_URL, getAuthHeaders, handleUnauthorized } from './api';

export interface Merma {
  id: string;
  productoId: string;
  cantidad: number;
  motivo: string;
  fechaMerma: string;
  usuarioId: string;
  producto?: {
    id: string;
    nombre: string;
    costoDirectoTotal: number;
    stockActual: number;
  };
  usuario?: {
    id: string;
    username: string;
  };
  createdAt?: string;
}

export interface RegistrarMermaDto {
  productoId: string;
  cantidad: number;
  motivo: string;
}

export async function fetchMermasApi(): Promise<Merma[]> {
  try {
    const res = await fetch(`${API_URL}/mermas`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) handleUnauthorized(res);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error al consultar mermas de la API:', err);
  }
  return [];
}

export async function registrarMermaApi(dto: RegistrarMermaDto): Promise<Merma> {
  const res = await fetch(`${API_URL}/mermas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (res.status === 401) handleUnauthorized(res);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Error al registrar la merma/descarte';
    throw new Error(message);
  }

  return await res.json();
}
