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

export class DashboardMetricsEntity {
  constructor(
    public readonly totalVentasUsd: number,
    public readonly totalVentasVes: number,
    public readonly cantidadVentas: number,
    public readonly cogsUsd: number,
    public readonly gastosFijosUsd: number,
    public readonly gastosVariablesUsd: number,
    public readonly gastosTotalesUsd: number,
    public readonly mermasTotalesUsd: number,
    public readonly cantidadMermas: number,
    public readonly utilidadBrutaUsd: number,
    public readonly utilidadNetaUsd: number,
    public readonly margenNetoPorcentaje: number,
    public readonly puntoEquilibrioUsd: number,
    public readonly porcentajePuntoEquilibrioAlcanzado: number,
    public readonly topProductos: TopProductoVendido[],
    public readonly alertasStock: AlertaStockBajo[],
  ) {}
}
