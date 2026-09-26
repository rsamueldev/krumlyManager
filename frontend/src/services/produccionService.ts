import { API_URL, getAuthHeaders, handleUnauthorized } from './api';

export interface ConsumoInsumoEstimado {
  insumoId: string;
  nombreInsumo: string;
  unidadMedida: string;
  stockActual: number;
  cantidadRequerida: number;
  faltante: number;
  suficiente: boolean;
}

export interface SimulacionProduccionResultado {
  productoId: string;
  nombreProducto: string;
  cantidadAProducir: number;
  puedoProducir: boolean;
  consumoInsumos: ConsumoInsumoEstimado[];
}

export interface LoteProduccion {
  id: string;
  productoId: string;
  recetaId?: string | null;
  cantidadProducida: number;
  fechaProduccion: string;
  notas?: string | null;
  usuarioId: string;
  producto?: { id: string; nombre: string; stockActual: number };
  receta?: { id: string; nombre: string } | null;
  usuario?: { id: string; username: string };
  createdAt?: string;
}

export interface RegistrarLoteDto {
  productoId: string;
  cantidadProducida: number;
  notas?: string;
}

export async function simularProduccionApi(
  productoId: string,
  cantidadAProducir: number,
): Promise<SimulacionProduccionResultado> {
  const params = new URLSearchParams({
    productoId,
    cantidad: cantidadAProducir.toString(),
  });

  const res = await fetch(`${API_URL}/produccion/simular?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (res.status === 401) handleUnauthorized(res);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al simular la producción');
  }

  return await res.json();
}

export async function registrarLoteApi(dto: RegistrarLoteDto): Promise<LoteProduccion> {
  const res = await fetch(`${API_URL}/produccion/lotes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (res.status === 401) handleUnauthorized(res);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Error al registrar el lote de producción';
    throw new Error(message);
  }

  return await res.json();
}

export async function fetchHistorialLotesApi(): Promise<LoteProduccion[]> {
  try {
    const res = await fetch(`${API_URL}/produccion/lotes`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) handleUnauthorized(res);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error al consultar historial de producción:', err);
  }
  return [];
}
