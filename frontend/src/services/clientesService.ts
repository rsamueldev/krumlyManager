import { API_URL, getAuthHeaders } from './api';

export interface Cliente {
  id: string;
  nombre: string;
  cedulaRif?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  activo: boolean;
  totalVentas?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrearClientePayload {
  nombre: string;
  cedulaRif?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  activo?: boolean;
}

export interface ActualizarClientePayload {
  nombre?: string;
  cedulaRif?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  activo?: boolean;
}

export async function fetchClientesApi(params?: { busqueda?: string; activo?: boolean }): Promise<Cliente[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.busqueda) queryParams.append('busqueda', params.busqueda);
    if (typeof params?.activo === 'boolean') queryParams.append('activo', String(params.activo));

    const url = `${API_URL}/clientes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error al consultar clientes:', err);
  }
  return [];
}

export async function fetchClienteByCedulaRifApi(cedulaRif: string): Promise<Cliente | null> {
  try {
    const res = await fetch(`${API_URL}/clientes/cedula/${encodeURIComponent(cedulaRif)}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error al consultar cliente por cédula/RIF:', err);
  }
  return null;
}

export async function createClienteApi(payload: CrearClientePayload): Promise<Cliente> {
  const res = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al registrar el cliente');
  }

  return await res.json();
}

export async function updateClienteApi(id: string, payload: ActualizarClientePayload): Promise<Cliente> {
  const res = await fetch(`${API_URL}/clientes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al actualizar el cliente');
  }

  return await res.json();
}

export async function toggleActivoClienteApi(id: string, activo?: boolean): Promise<Cliente> {
  const res = await fetch(`${API_URL}/clientes/${id}/toggle`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ activo }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al cambiar estado del cliente');
  }

  return await res.json();
}
