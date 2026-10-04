import { CategoriaEntity } from './categoria.entity';
import { InsumoEntity } from './insumo.entity';
import { RecetaEntity } from './receta.entity';

export type TipoUsoInsumo = 'produccion' | 'despacho';

export class ProductoInsumoAdicionalEntity {
  constructor(
    public readonly id: string,
    public readonly productoId: string,
    public readonly insumoId: string,
    public readonly cantidad: number,
    public readonly tipoUso: TipoUsoInsumo = 'produccion',
    public readonly costoCalculado?: number,
    public readonly insumo?: InsumoEntity,
  ) {}
}

export class ProductoEntity {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly categoriaId?: string,
    public readonly recetaId?: string,
    public readonly pesoMasaGramos: number = 0,
    public readonly costoMasaUnidad: number = 0,
    public readonly costoInsumosAdicionales: number = 0,
    public readonly costoEmpaque: number = 0,
    public readonly costoManoObra: number = 0,
    public readonly costoDepreciacion: number = 0,
    public readonly porcentajeDesperdicio: number = 5,
    public readonly costoDirectoTotal: number = 0,
    public readonly precioVenta: number = 0,
    public readonly margenGananciaPorcentaje: number = 0,
    public readonly stockActual: number = 0,
    public readonly stockMinimo: number = 10,
    public readonly activo: boolean = true,
    public readonly categoria?: CategoriaEntity,
    public readonly receta?: RecetaEntity,
    public readonly insumosAdicionales: ProductoInsumoAdicionalEntity[] = [],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  public static calcularCostos(
    pesoMasaGramos: number,
    costoPorGramoReceta: number,
    costoRellenosAdicionales: number = 0,  // insumos tipoUso='produccion'
    costoEmpaqueDespacho: number = 0,      // insumos tipoUso='despacho' (auto)
    costoManoObra: number = 0,
    costoDepreciacion: number = 0,
    porcentajeDesperdicio: number = 5,
    precioVenta: number = 0,
  ): {
    costoMasaUnidad: number;
    costoDirectoTotal: number;
    margenGananciaPorcentaje: number;
  } {
    const costoMasaUnidad = Number((pesoMasaGramos * costoPorGramoReceta).toFixed(4));
    
    const subtotalDirecto =
      costoMasaUnidad +
      costoRellenosAdicionales +
      costoEmpaqueDespacho +
      costoManoObra +
      costoDepreciacion;

    const factorDesperdicio = 1 + Math.max(0, porcentajeDesperdicio) / 100;
    const costoDirectoTotal = Number((subtotalDirecto * factorDesperdicio).toFixed(2));

    let margenGananciaPorcentaje = 0;
    if (precioVenta > 0) {
      margenGananciaPorcentaje = Number(
        (((precioVenta - costoDirectoTotal) / precioVenta) * 100).toFixed(2),
      );
    }

    return {
      costoMasaUnidad,
      costoDirectoTotal,
      margenGananciaPorcentaje,
    };
  }
}
