import { API_URL, getAuthHeaders } from './api';

export interface VentaDetallePayload {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface VentaPagoPayload {
  metodoPago: 'efectivo_usd' | 'efectivo_ves' | 'pago_movil' | 'punto_venta' | 'transferencia';
  montoUsd: number;
  montoVes?: number;
  tasaCambio?: number;
  referenciaPago?: string;
}

export interface VentaPayload {
  clienteId?: string;
  totalVenta: number;
  estadoSincronizacion?: 'online' | 'offline_pending' | 'offline_synced';
  detalles: VentaDetallePayload[];
  pagos: VentaPagoPayload[];
}

export interface VentaResponse {
  id: string;
  codigoVenta: string;
  fechaVenta: string;
  totalVenta: number;
  estadoSincronizacion?: string;
  cliente?: { id: string; nombre: string } | null;
  usuario?: { id: string; username: string };
  detalles: any[];
  pagos: any[];
}

export async function createVentaApi(payload: VentaPayload): Promise<VentaResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/ventas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new Error('No se pudo conectar con el servidor NestJS (Backend). Verifica que la API esté encendida.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('Sesión no autorizada o token expirado. Por favor inicia sesión nuevamente.');
    }
    throw new Error(errData.message || `Error del servidor (${res.status}) al procesar la venta`);
  }

  return await res.json();
}

export async function fetchVentasApi(): Promise<VentaResponse[]> {
  try {
    const res = await fetch(`${API_URL}/ventas`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error al consultar ventas de la API:', err);
  }
  return [];
}

export async function syncVentasOfflineApi(ventasOfflinePayloads: VentaPayload[]): Promise<VentaResponse[]> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/ventas/batch-sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ventas: ventasOfflinePayloads }),
    });
  } catch (err: any) {
    throw new Error('No hay conexión con el servidor para sincronizar las ventas offline.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al sincronizar las ventas offline con el servidor');
  }

  return await res.json();
}
