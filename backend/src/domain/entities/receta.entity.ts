import { InsumoEntity } from './insumo.entity';

export class RecetaInsumoEntity {
  constructor(
    public readonly id: string,
    public readonly recetaId: string,
    public readonly insumoId: string,
    public readonly cantidad: number,
    public readonly costoCalculado?: number,
    public readonly insumo?: InsumoEntity,
  ) {}
}

export class RecetaEntity {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly pesoTotalMezclaGramos: number,
    public readonly costoTotalLote: number,
    public readonly costoPorGramo: number,
    public readonly usuarioId: string,
    public readonly insumos: RecetaInsumoEntity[] = [],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  public static calcularCostos(
    insumosConDetalle: { insumoId: string; cantidad: number; costoUnitario: number }[],
    pesoTotalGramos: number,
  ): { costoTotalLote: number; costoPorGramo: number } {
    if (pesoTotalGramos <= 0) {
      return { costoTotalLote: 0, costoPorGramo: 0 };
    }

    const costoTotalLote = insumosConDetalle.reduce((acc, item) => {
      return acc + item.cantidad * item.costoUnitario;
    }, 0);

    const costoPorGramo = costoTotalLote / pesoTotalGramos;

    return {
      costoTotalLote: Number(costoTotalLote.toFixed(2)),
      costoPorGramo: Number(costoPorGramo.toFixed(4)),
    };
  }
}
