import { InsumoEntity, UnidadMedidaEnum } from '../../domain/entities/insumo.entity';
import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';

export interface CrearInsumoDto {
  nombre: string;
  unidadMedida: UnidadMedidaEnum;
  cantidadEmpaque: number;
  precioCompra: number;
  stockActual?: number;
  stockMinimo?: number;
}

export class CrearInsumoUseCase {
  constructor(private readonly insumoRepository: InsumoRepositoryPort) {}

  async execute(dto: CrearInsumoDto): Promise<InsumoEntity> {
    if (!dto.nombre || dto.nombre.trim().length === 0) {
      throw new Error('El nombre del insumo es obligatorio');
    }

    if (dto.cantidadEmpaque <= 0) {
      throw new Error('La cantidad del empaque debe ser mayor a 0');
    }

    if (dto.precioCompra < 0) {
      throw new Error('El precio de compra no puede ser negativo');
    }

    const costoUnitario = InsumoEntity.calcularCostoUnitario(
      dto.precioCompra,
      dto.cantidadEmpaque,
    );

    return this.insumoRepository.create({
      nombre: dto.nombre.trim(),
      unidadMedida: dto.unidadMedida,
      cantidadEmpaque: dto.cantidadEmpaque,
      precioCompra: dto.precioCompra,
      costoUnitario,
      stockActual: dto.stockActual ?? 0,
      stockMinimo: dto.stockMinimo ?? 500,
    });
  }
}
