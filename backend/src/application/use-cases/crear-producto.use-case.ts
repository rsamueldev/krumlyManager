import { ProductoEntity } from '../../domain/entities/producto.entity';
import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';
import {
  InsumoAdicionalInput,
  ProductoRepositoryPort,
} from '../../domain/ports/producto-repository.port';
import { RecetaRepositoryPort } from '../../domain/ports/receta-repository.port';

export interface CrearProductoDto {
  nombre: string;
  categoriaId?: string;
  recetaId?: string;
  pesoMasaGramos?: number;
  costoEmpaque?: number;
  costoManoObra?: number;
  costoDepreciacion?: number;
  porcentajeDesperdicio?: number;
  precioVenta: number;
  stockActual?: number;
  stockMinimo?: number;
  insumosAdicionales?: InsumoAdicionalInput[];
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

    let costoPorGramoReceta = 0;
    if (dto.recetaId) {
      const receta = await this.recetaRepository.findById(dto.recetaId);
      if (receta) {
        costoPorGramoReceta = receta.costoPorGramo;
      }
    }

    // Calcular costo de insumos adicionales / toppings
    let costoInsumosAdicionales = 0;
    if (dto.insumosAdicionales && dto.insumosAdicionales.length > 0) {
      for (const item of dto.insumosAdicionales) {
        const insumo = await this.insumoRepository.findById(item.insumoId);
        if (insumo) {
          costoInsumosAdicionales += item.cantidad * insumo.costoUnitario;
        }
      }
    }
    costoInsumosAdicionales = Number(costoInsumosAdicionales.toFixed(4));

    const pesoMasa = dto.pesoMasaGramos || 0;
    const { costoMasaUnidad, costoDirectoTotal, margenGananciaPorcentaje } =
      ProductoEntity.calcularCostos(
        pesoMasa,
        costoPorGramoReceta,
        costoInsumosAdicionales,
        dto.costoEmpaque || 0,
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
      costoInsumosAdicionales,
      costoEmpaque: dto.costoEmpaque || 0,
      costoManoObra: dto.costoManoObra || 0,
      costoDepreciacion: dto.costoDepreciacion || 0,
      porcentajeDesperdicio: dto.porcentajeDesperdicio ?? 5,
      costoDirectoTotal,
      precioVenta: dto.precioVenta,
      margenGananciaPorcentaje,
      stockActual: dto.stockActual ?? 0,
      stockMinimo: dto.stockMinimo ?? 10,
      insumosAdicionales: dto.insumosAdicionales,
    });
  }
}
