import { ProductoEntity } from '../../domain/entities/producto.entity';
import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';
import {
  InsumoAdicionalInput,
  ProductoRepositoryPort,
} from '../../domain/ports/producto-repository.port';
import { RecetaRepositoryPort } from '../../domain/ports/receta-repository.port';

export interface ActualizarProductoDto {
  nombre?: string;
  categoriaId?: string;
  recetaId?: string;
  pesoMasaGramos?: number;
  costoEmpaque?: number;
  costoManoObra?: number;
  costoDepreciacion?: number;
  porcentajeDesperdicio?: number;
  precioVenta?: number;
  stockActual?: number;
  stockMinimo?: number;
  activo?: boolean;
  insumosAdicionales?: InsumoAdicionalInput[];
}

export class ActualizarProductoUseCase {
  constructor(
    private readonly productoRepository: ProductoRepositoryPort,
    private readonly recetaRepository: RecetaRepositoryPort,
    private readonly insumoRepository: InsumoRepositoryPort,
  ) {}

  async execute(id: string, dto: ActualizarProductoDto): Promise<ProductoEntity> {
    const productoExistente = await this.productoRepository.findById(id);
    if (!productoExistente) {
      throw new Error(`Producto con ID ${id} no fue encontrado`);
    }

    const recetaIdTarget = dto.recetaId !== undefined ? dto.recetaId : productoExistente.recetaId;
    let costoPorGramoReceta = 0;
    if (recetaIdTarget) {
      const receta = await this.recetaRepository.findById(recetaIdTarget);
      if (receta) {
        costoPorGramoReceta = receta.costoPorGramo;
      }
    }

    const toppingsTarget =
      dto.insumosAdicionales !== undefined
        ? dto.insumosAdicionales
        : productoExistente.insumosAdicionales.map((i) => ({
            insumoId: i.insumoId,
            cantidad: i.cantidad,
          }));

    let costoInsumosAdicionales = 0;
    for (const item of toppingsTarget) {
      const insumo = await this.insumoRepository.findById(item.insumoId);
      if (insumo) {
        costoInsumosAdicionales += item.cantidad * insumo.costoUnitario;
      }
    }
    costoInsumosAdicionales = Number(costoInsumosAdicionales.toFixed(4));

    const pesoMasa = dto.pesoMasaGramos !== undefined ? dto.pesoMasaGramos : productoExistente.pesoMasaGramos;
    const costoEmp = dto.costoEmpaque !== undefined ? dto.costoEmpaque : productoExistente.costoEmpaque;
    const costoMO = dto.costoManoObra !== undefined ? dto.costoManoObra : productoExistente.costoManoObra;
    const costoDep = dto.costoDepreciacion !== undefined ? dto.costoDepreciacion : productoExistente.costoDepreciacion;
    const pctDesp = dto.porcentajeDesperdicio !== undefined ? dto.porcentajeDesperdicio : productoExistente.porcentajeDesperdicio;
    const precioV = dto.precioVenta !== undefined ? dto.precioVenta : productoExistente.precioVenta;

    const { costoMasaUnidad, costoDirectoTotal, margenGananciaPorcentaje } =
      ProductoEntity.calcularCostos(
        pesoMasa,
        costoPorGramoReceta,
        costoInsumosAdicionales,
        costoEmp,
        costoMO,
        costoDep,
        pctDesp,
        precioV,
      );

    return this.productoRepository.update(id, {
      nombre: dto.nombre ? dto.nombre.trim() : undefined,
      categoriaId: dto.categoriaId,
      recetaId: dto.recetaId,
      pesoMasaGramos: pesoMasa,
      costoMasaUnidad,
      costoInsumosAdicionales,
      costoEmpaque: costoEmp,
      costoManoObra: costoMO,
      costoDepreciacion: costoDep,
      porcentajeDesperdicio: pctDesp,
      costoDirectoTotal,
      precioVenta: precioV,
      margenGananciaPorcentaje,
      stockActual: dto.stockActual,
      stockMinimo: dto.stockMinimo,
      activo: dto.activo,
      insumosAdicionales: dto.insumosAdicionales,
    });
  }
}
