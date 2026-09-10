import { InsumoEntity, UnidadMedidaEnum } from '../../domain/entities/insumo.entity';
import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';

export interface ActualizarInsumoDto {
  nombre?: string;
  unidadMedida?: UnidadMedidaEnum;
  cantidadEmpaque?: number;
  precioCompra?: number;
  stockActual?: number;
  stockMinimo?: number;
}

export class ActualizarInsumoUseCase {
  constructor(private readonly insumoRepository: InsumoRepositoryPort) {}

  async execute(id: string, dto: ActualizarInsumoDto): Promise<InsumoEntity> {
    const insumoExistente = await this.insumoRepository.findById(id);
    if (!insumoExistente) {
      throw new Error('Insumo no encontrado');
    }

    const nuevaCantidadEmpaque = dto.cantidadEmpaque ?? insumoExistente.cantidadEmpaque;
    const nuevoPrecioCompra = dto.precioCompra ?? insumoExistente.precioCompra;

    if (nuevaCantidadEmpaque <= 0) {
      throw new Error('La cantidad del empaque debe ser mayor a 0');
    }

    if (nuevoPrecioCompra < 0) {
      throw new Error('El precio de compra no puede ser negativo');
    }

    const nuevoCostoUnitario = InsumoEntity.calcularCostoUnitario(
      nuevoPrecioCompra,
      nuevaCantidadEmpaque,
    );

    return this.insumoRepository.update(id, {
      ...(dto.nombre && { nombre: dto.nombre.trim() }),
      ...(dto.unidadMedida && { unidadMedida: dto.unidadMedida }),
      cantidadEmpaque: nuevaCantidadEmpaque,
      precioCompra: nuevoPrecioCompra,
      costoUnitario: nuevoCostoUnitario,
      ...(dto.stockActual !== undefined && { stockActual: dto.stockActual }),
      ...(dto.stockMinimo !== undefined && { stockMinimo: dto.stockMinimo }),
    });
  }
}
