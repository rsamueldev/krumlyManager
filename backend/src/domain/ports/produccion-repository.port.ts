import { LoteProduccionEntity } from '../entities/lote-produccion.entity';

export const PRODUCCION_REPOSITORY_PORT = 'PRODUCCION_REPOSITORY_PORT';

export interface ConsumoInsumoEstimado {
  insumoId: string;
  nombreInsumo: string;
  unidadMedida: string;
  stockActual: number;
  cantidadRequerida: number;
  faltante: number;
  suficiente: boolean;
}

export interface SimularProduccionResultado {
  productoId: string;
  nombreProducto: string;
  cantidadAProducir: number;
  puedoProducir: boolean;
  consumoInsumos: ConsumoInsumoEstimado[];
}

export interface ProduccionRepositoryPort {
  registrarLote(data: {
    productoId: string;
    cantidadProducida: number;
    usuarioId: string;
    notas?: string;
  }): Promise<LoteProduccionEntity>;

  simularProduccion(productoId: string, cantidadAProducir: number): Promise<SimularProduccionResultado>;

  obtenerHistorialLotes(limit?: number): Promise<LoteProduccionEntity[]>;
}
