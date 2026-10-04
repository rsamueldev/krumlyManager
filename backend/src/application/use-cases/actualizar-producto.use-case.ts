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
  // costoEmpaque is NOT a manual field — it's auto-derived from despacho insumos
  costoManoObra?: number;
  costoDepreciacion?: number;
  porcentajeDesperdicio?: number;
  precioVenta?: number;
  stockActual?: number;
  stockMinimo?: number;
  activo?: boolean;
  insumosAdicionales?: InsumoAdicionalInput[];  // each has tipoUso: 'produccion' | 'despacho'
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

    // Resolver la lista final de insumos adicionales
    const toppingsTarget: InsumoAdicionalInput[] =
      dto.insumosAdicionales !== undefined
        ? dto.insumosAdicionales
        : productoExistente.insumosAdicionales.map((i) => ({
            insumoId: i.insumoId,
            cantidad: i.cantidad,
            tipoUso: i.tipoUso as 'produccion' | 'despacho',
          }));

    // Separar por fase
    const insumosProduccion = toppingsTarget.filter(i => i.tipoUso === 'produccion');
    const insumosDespacho   = toppingsTarget.filter(i => i.tipoUso === 'despacho');

    let costoRellenosAdicionales = 0;
    for (const item of insumosProduccion) {
      const insumo = await this.insumoRepository.findById(item.insumoId);
      if (insumo) costoRellenosAdicionales += item.cantidad * insumo.costoUnitario;
    }
    costoRellenosAdicionales = Number(costoRellenosAdicionales.toFixed(4));

    let costoEmpaqueDespacho = 0;
    for (const item of insumosDespacho) {
      const insumo = await this.insumoRepository.findById(item.insumoId);
      if (insumo) costoEmpaqueDespacho += item.cantidad * insumo.costoUnitario;
    }
    costoEmpaqueDespacho = Number(costoEmpaqueDespacho.toFixed(4));

    const pesoMasa = dto.pesoMasaGramos !== undefined ? dto.pesoMasaGramos : productoExistente.pesoMasaGramos;
    const costoMO  = dto.costoManoObra !== undefined ? dto.costoManoObra : productoExistente.costoManoObra;
    const costoDep = dto.costoDepreciacion !== undefined ? dto.costoDepreciacion : productoExistente.costoDepreciacion;
    const pctDesp  = dto.porcentajeDesperdicio !== undefined ? dto.porcentajeDesperdicio : productoExistente.porcentajeDesperdicio;
    const precioV  = dto.precioVenta !== undefined ? dto.precioVenta : productoExistente.precioVenta;

    const { costoMasaUnidad, costoDirectoTotal, margenGananciaPorcentaje } =
      ProductoEntity.calcularCostos(
        pesoMasa,
        costoPorGramoReceta,
        costoRellenosAdicionales,
        costoEmpaqueDespacho,
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
      costoInsumosAdicionales: costoRellenosAdicionales,
      costoEmpaque: costoEmpaqueDespacho,  // ← automático
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
