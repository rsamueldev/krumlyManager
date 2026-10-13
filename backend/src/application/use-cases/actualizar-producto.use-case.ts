import { ProductoEntity } from '../../domain/entities/producto.entity';
import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';
import {
  ComboItemInput,
  InsumoAdicionalInput,
  ProductoRepositoryPort,
} from '../../domain/ports/producto-repository.port';
import { RecetaRepositoryPort } from '../../domain/ports/receta-repository.port';

export interface ActualizarProductoDto {
  nombre?: string;
  categoriaId?: string;
  recetaId?: string;
  pesoMasaGramos?: number;
  costoManoObra?: number;
  costoDepreciacion?: number;
  porcentajeDesperdicio?: number;
  precioVenta?: number;
  stockActual?: number;
  stockMinimo?: number;
  esCombo?: boolean;
  stockCongelador?: number;
  activo?: boolean;
  insumosAdicionales?: InsumoAdicionalInput[];
  comboItems?: ComboItemInput[];
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

    const esCombo = dto.esCombo !== undefined ? dto.esCombo : productoExistente.esCombo;

    // Insumos adicionales (empaque / despacho / producción)
    const toppingsTarget: InsumoAdicionalInput[] =
      dto.insumosAdicionales !== undefined
        ? dto.insumosAdicionales
        : productoExistente.insumosAdicionales.map((i) => ({
            insumoId: i.insumoId,
            cantidad: i.cantidad,
            tipoUso: i.tipoUso as 'produccion' | 'despacho',
          }));

    const insumosProduccion = toppingsTarget.filter(i => i.tipoUso === 'produccion');
    const insumosDespacho   = toppingsTarget.filter(i => i.tipoUso === 'despacho');

    let costoEmpaqueDespacho = 0;
    for (const item of insumosDespacho) {
      const insumo = await this.insumoRepository.findById(item.insumoId);
      if (insumo) costoEmpaqueDespacho += item.cantidad * insumo.costoUnitario;
    }
    costoEmpaqueDespacho = Number(costoEmpaqueDespacho.toFixed(4));

    const costoMO  = dto.costoManoObra !== undefined ? dto.costoManoObra : productoExistente.costoManoObra;
    const costoDep = dto.costoDepreciacion !== undefined ? dto.costoDepreciacion : productoExistente.costoDepreciacion;
    const pctDesp  = dto.porcentajeDesperdicio !== undefined ? dto.porcentajeDesperdicio : productoExistente.porcentajeDesperdicio;
    const precioV  = dto.precioVenta !== undefined ? dto.precioVenta : productoExistente.precioVenta;

    if (esCombo) {
      const comboItemsTarget = dto.comboItems !== undefined ? dto.comboItems : productoExistente.comboItems.map(ci => ({
        productoId: ci.productoId,
        cantidad: ci.cantidad,
      }));

      let costoGalletasHijas = 0;
      for (const ci of comboItemsTarget) {
        const prodHijo = await this.productoRepository.findById(ci.productoId);
        if (prodHijo) {
          // Se resta el empaque individual de la galleta para no duplicar con la caja del combo
          const costoBaseSinEmpaque = Math.max(
            0,
            Number(prodHijo.costoDirectoTotal || 0) - Number(prodHijo.costoEmpaque || 0),
          );
          costoGalletasHijas += costoBaseSinEmpaque * (ci.cantidad || 1);
        }
      }
      costoGalletasHijas = Number(costoGalletasHijas.toFixed(4));

      const subtotalDirecto = costoGalletasHijas + costoEmpaqueDespacho + (costoMO || 0) + (costoDep || 0);
      const factorDesp = 1 + Math.max(0, pctDesp ?? 0) / 100;
      const costoDirectoTotal = Number((subtotalDirecto * factorDesp).toFixed(2));
      let margenGananciaPorcentaje = 0;
      if (precioV > 0) {
        margenGananciaPorcentaje = Number((((precioV - costoDirectoTotal) / precioV) * 100).toFixed(2));
      }

      return this.productoRepository.update(id, {
        nombre: dto.nombre ? dto.nombre.trim() : undefined,
        categoriaId: dto.categoriaId,
        recetaId: undefined,
        pesoMasaGramos: 0,
        costoMasaUnidad: 0,
        costoInsumosAdicionales: costoGalletasHijas,
        costoEmpaque: costoEmpaqueDespacho,
        costoManoObra: costoMO,
        costoDepreciacion: costoDep,
        porcentajeDesperdicio: pctDesp,
        costoDirectoTotal,
        precioVenta: precioV,
        margenGananciaPorcentaje,
        stockActual: dto.stockActual,
        stockMinimo: dto.stockMinimo,
        esCombo: true,
        stockCongelador: 0,
        activo: dto.activo,
        insumosAdicionales: dto.insumosAdicionales,
        comboItems: dto.comboItems,
      });
    }

    // Galleta individual
    const recetaIdTarget = dto.recetaId !== undefined ? dto.recetaId : productoExistente.recetaId;
    let costoPorGramoReceta = 0;
    if (recetaIdTarget) {
      const receta = await this.recetaRepository.findById(recetaIdTarget);
      if (receta) costoPorGramoReceta = receta.costoPorGramo;
    }

    let costoRellenosAdicionales = 0;
    for (const item of insumosProduccion) {
      const insumo = await this.insumoRepository.findById(item.insumoId);
      if (insumo) costoRellenosAdicionales += item.cantidad * insumo.costoUnitario;
    }
    costoRellenosAdicionales = Number(costoRellenosAdicionales.toFixed(4));

    const pesoMasa = dto.pesoMasaGramos !== undefined ? dto.pesoMasaGramos : productoExistente.pesoMasaGramos;

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
      costoEmpaque: costoEmpaqueDespacho,
      costoManoObra: costoMO,
      costoDepreciacion: costoDep,
      porcentajeDesperdicio: pctDesp,
      costoDirectoTotal,
      precioVenta: precioV,
      margenGananciaPorcentaje,
      stockActual: dto.stockActual,
      stockMinimo: dto.stockMinimo,
      esCombo: false,
      stockCongelador: dto.stockCongelador,
      activo: dto.activo,
      insumosAdicionales: dto.insumosAdicionales,
      comboItems: undefined,
    });
  }
}
