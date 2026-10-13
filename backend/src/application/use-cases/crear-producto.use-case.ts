import { ProductoEntity } from '../../domain/entities/producto.entity';
import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';
import {
  ComboItemInput,
  InsumoAdicionalInput,
  ProductoRepositoryPort,
} from '../../domain/ports/producto-repository.port';
import { RecetaRepositoryPort } from '../../domain/ports/receta-repository.port';

export interface CrearProductoDto {
  nombre: string;
  categoriaId?: string;
  recetaId?: string;
  pesoMasaGramos?: number;
  // costoEmpaque is NO LONGER a manual field — it's auto-calculated from despacho insumos
  costoManoObra?: number;
  costoDepreciacion?: number;
  porcentajeDesperdicio?: number;
  precioVenta: number;
  stockActual?: number;
  stockMinimo?: number;
  esCombo?: boolean;
  stockCongelador?: number;
  insumosAdicionales?: InsumoAdicionalInput[];  // each has tipoUso: 'produccion' | 'despacho'
  comboItems?: ComboItemInput[];
}

export class CrearProductoUseCase {
  constructor(
    private readonly productoRepository: ProductoRepositoryPort,
    private readonly recetaRepository: RecetaRepositoryPort,
    private readonly insumoRepository: InsumoRepositoryPort,
  ) {}

  async execute(dto: CrearProductoDto): Promise<ProductoEntity> {
    if (!dto.nombre || dto.nombre.trim().length === 0) {
      throw new Error('El nombre del producto es obligatorio');
    }

    if (dto.precioVenta < 0) {
      throw new Error('El precio de venta no puede ser negativo');
    }

    // Separar insumos por fase de consumo
    const insumosProduccion = (dto.insumosAdicionales || []).filter(i => i.tipoUso === 'produccion');
    const insumosDespacho   = (dto.insumosAdicionales || []).filter(i => i.tipoUso === 'despacho');

    // Calcular costo de empaque/decoracion final (se gastan al hornear/empacar)
    let costoEmpaqueDespacho = 0;
    for (const item of insumosDespacho) {
      const insumo = await this.insumoRepository.findById(item.insumoId);
      if (insumo) costoEmpaqueDespacho += item.cantidad * insumo.costoUnitario;
    }
    costoEmpaqueDespacho = Number(costoEmpaqueDespacho.toFixed(4));

    if (dto.esCombo) {
      // Costeo para Combo / Caja armada:
      // Suma el costo de las galletas hijas incluidas + empaque de la caja + indirectos
      let costoGalletasHijas = 0;
      if (dto.comboItems && dto.comboItems.length > 0) {
        for (const ci of dto.comboItems) {
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
      }
      costoGalletasHijas = Number(costoGalletasHijas.toFixed(4));

      const subtotalDirecto =
        costoGalletasHijas +
        costoEmpaqueDespacho +
        (dto.costoManoObra || 0) +
        (dto.costoDepreciacion || 0);

      const factorDesp = 1 + Math.max(0, dto.porcentajeDesperdicio ?? 0) / 100;
      const costoDirectoTotal = Number((subtotalDirecto * factorDesp).toFixed(2));
      let margenGananciaPorcentaje = 0;
      if (dto.precioVenta > 0) {
        margenGananciaPorcentaje = Number(
          (((dto.precioVenta - costoDirectoTotal) / dto.precioVenta) * 100).toFixed(2),
        );
      }

      return this.productoRepository.create({
        nombre: dto.nombre.trim(),
        categoriaId: dto.categoriaId || undefined,
        recetaId: undefined,
        pesoMasaGramos: 0,
        costoMasaUnidad: 0,
        costoInsumosAdicionales: costoGalletasHijas,
        costoEmpaque: costoEmpaqueDespacho,
        costoManoObra: dto.costoManoObra || 0,
        costoDepreciacion: dto.costoDepreciacion || 0,
        porcentajeDesperdicio: dto.porcentajeDesperdicio ?? 0,
        costoDirectoTotal,
        precioVenta: dto.precioVenta,
        margenGananciaPorcentaje,
        stockActual: dto.stockActual ?? 0,
        stockMinimo: dto.stockMinimo ?? 5,
        esCombo: true,
        stockCongelador: 0,
        insumosAdicionales: dto.insumosAdicionales,
        comboItems: dto.comboItems,
      });
    }

    // Producto individual / Galleta normal
    let costoPorGramoReceta = 0;
    if (dto.recetaId) {
      const receta = await this.recetaRepository.findById(dto.recetaId);
      if (receta) {
        costoPorGramoReceta = receta.costoPorGramo;
      }
    }

    // Calcular costo de rellenos/toppings (se gastan al amasar)
    let costoRellenosAdicionales = 0;
    for (const item of insumosProduccion) {
      const insumo = await this.insumoRepository.findById(item.insumoId);
      if (insumo) costoRellenosAdicionales += item.cantidad * insumo.costoUnitario;
    }
    costoRellenosAdicionales = Number(costoRellenosAdicionales.toFixed(4));

    const pesoMasa = dto.pesoMasaGramos || 0;
    const { costoMasaUnidad, costoDirectoTotal, margenGananciaPorcentaje } =
      ProductoEntity.calcularCostos(
        pesoMasa,
        costoPorGramoReceta,
        costoRellenosAdicionales,
        costoEmpaqueDespacho,
        dto.costoManoObra || 0,
        dto.costoDepreciacion || 0,
        dto.porcentajeDesperdicio ?? 5,
        dto.precioVenta,
      );

    return this.productoRepository.create({
      nombre: dto.nombre.trim(),
      categoriaId: dto.categoriaId || undefined,
      recetaId: dto.recetaId || undefined,
      pesoMasaGramos: pesoMasa,
      costoMasaUnidad,
      costoInsumosAdicionales: costoRellenosAdicionales,
      costoEmpaque: costoEmpaqueDespacho,
      costoManoObra: dto.costoManoObra || 0,
      costoDepreciacion: dto.costoDepreciacion || 0,
      porcentajeDesperdicio: dto.porcentajeDesperdicio ?? 5,
      costoDirectoTotal,
      precioVenta: dto.precioVenta,
      margenGananciaPorcentaje,
      stockActual: dto.stockActual ?? 0,
      stockMinimo: dto.stockMinimo ?? 10,
      esCombo: false,
      stockCongelador: dto.stockCongelador ?? 0,
      insumosAdicionales: dto.insumosAdicionales,
      comboItems: undefined,
    });
  }
}
