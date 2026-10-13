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

export interface ConsumoCongeladorItem {
  productoId: string;
  nombreProducto: string;
  cantidadRequerida: number;
  stockDisponible: number;
  faltante: number;
  suficiente: boolean;
}

export interface SimularHorneadoResultado {
  productoId: string;
  nombreProducto: string;
  cantidadAHornear: number;
  esCombo: boolean;
  puedoHornear: boolean;
  consumoCongelador: ConsumoCongeladorItem[];
  consumoEmpaque: ConsumoInsumoEstimado[];
}

export interface LoteProduccion {
  id: string;
  productoId: string;
  recetaId?: string | null;
  tipoLote?: string;
  cantidadProducida: number;
  fechaProduccion: string;
  notas?: string | null;
  usuarioId: string;
  producto?: { id: string; nombre: string; stockActual: number; stockCongelador?: number };
  receta?: { id: string; nombre: string } | null;
  usuario?: { id: string; username: string };
  createdAt?: string;
}

export interface RegistrarLoteDto {
  productoId: string;
  cantidadProducida: number;
  notas?: string;
}

export interface HornearLoteDto {
  productoId: string;
  cantidad: number;
  notas?: string;
  galletasSeleccionadas?: Array<{ productoId: string; cantidad: number }>;
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

export async function simularHorneadoApi(
  productoId: string,
  cantidadAHornear: number,
): Promise<SimularHorneadoResultado> {
  const params = new URLSearchParams({
    productoId,
    cantidad: cantidadAHornear.toString(),
  });

  const res = await fetch(`${API_URL}/produccion/simular-horneado?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (res.status === 401) handleUnauthorized(res);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al simular el horneado y empaque');
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

export async function hornearLoteApi(dto: HornearLoteDto): Promise<LoteProduccion> {
  const res = await fetch(`${API_URL}/produccion/hornear`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (res.status === 401) handleUnauthorized(res);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Error al hornear y empacar';
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
