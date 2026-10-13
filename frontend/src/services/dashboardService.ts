import { API_URL, getAuthHeaders, handleUnauthorized } from './api';

export interface TopProductoVendido {
  productoId: string;
  nombre: string;
  cantidadVendida: number;
  totalVentasUsd: number;
  gananciaUsd: number;
}

export interface DesgloseProductoPeriodo {
  productoId: string;
  nombre: string;
  esCombo: boolean;
  cantidadVendida: number;
  totalVentasUsd: number;
}

export interface AlertaStockBajo {
  tipo: 'producto' | 'insumo';
  id: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  stockCongelador?: number;
  unidadMedida?: string;
}

export interface DashboardMetrics {
  totalVentasUsd: number;
  totalVentasVes: number;
  cantidadVentas: number;
  cogsUsd: number;
  gastosFijosUsd: number;
  gastosVariablesUsd: number;
  gastosTotalesUsd: number;
  mermasTotalesUsd: number;
  cantidadMermas: number;
  utilidadBrutaUsd: number;
  utilidadNetaUsd: number;
  margenNetoPorcentaje: number;
  puntoEquilibrioUsd: number;
  porcentajePuntoEquilibrioAlcanzado: number;
  topProductos: TopProductoVendido[];
  alertasStock: AlertaStockBajo[];
  totalUnidadesVendidas: number;
  ticketPromedioUsd: number;
  desgloseProductos: DesgloseProductoPeriodo[];
  periodo: string;
}

export async function fetchDashboardMetricsApi(
  periodo: string = 'hoy',
  desde?: string,
  hasta?: string,
): Promise<DashboardMetrics | null> {
  try {
    const params = new URLSearchParams();
    if (periodo) params.set('periodo', periodo);
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_URL}/dashboard/metrics${queryString}`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) handleUnauthorized(res);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error al consultar métricas del dashboard:', err);
  }
  return null;
}
