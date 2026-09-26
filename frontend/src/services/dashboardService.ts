import { API_URL, getAuthHeaders, handleUnauthorized } from './api';

export interface TopProductoVendido {
  productoId: string;
  nombre: string;
  cantidadVendida: number;
  totalVentasUsd: number;
  gananciaUsd: number;
}

export interface AlertaStockBajo {
  tipo: 'producto' | 'insumo';
  id: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
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
}

export async function fetchDashboardMetricsApi(): Promise<DashboardMetrics | null> {
  try {
    const res = await fetch(`${API_URL}/dashboard/metrics`, {
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
