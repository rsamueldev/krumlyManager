import { RecetaEntity } from '../../domain/entities/receta.entity';
import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';
import { RecetaRepositoryPort } from '../../domain/ports/receta-repository.port';

export interface InsumoRecetaInput {
  insumoId: string;
  cantidad: number;
}

export interface CrearRecetaDto {
  nombre: string;
  pesoTotalMezclaGramos: number;
  insumos: InsumoRecetaInput[];
  usuarioId: string;
}

export class CrearRecetaUseCase {
  constructor(
    private readonly recetaRepository: RecetaRepositoryPort,
    private readonly insumoRepository: InsumoRepositoryPort,
  ) {}

  async execute(dto: CrearRecetaDto): Promise<RecetaEntity> {
    if (!dto.nombre || dto.nombre.trim().length === 0) {
      throw new Error('El nombre de la receta es obligatorio');
    }

    if (!dto.pesoTotalMezclaGramos || dto.pesoTotalMezclaGramos <= 0) {
      throw new Error('El peso total de la mezcla debe ser mayor a 0');
    }

    if (!dto.insumos || dto.insumos.length === 0) {
      throw new Error('Debe agregar al menos un ingrediente a la receta');
    }

    // Obtener detalles de cada insumo para calcular el costo unitario por g/ml
    const insumosConDetalle = await Promise.all(
      dto.insumos.map(async (item) => {
        const insumo = await this.insumoRepository.findById(item.insumoId);
        if (!insumo) {
          throw new Error(`Insumo con ID ${item.insumoId} no fue encontrado`);
        }
        return {
          insumoId: item.insumoId,
          cantidad: item.cantidad,
          costoUnitario: insumo.costoUnitario,
        };
      }),
    );

    const { costoTotalLote, costoPorGramo } = RecetaEntity.calcularCostos(
      insumosConDetalle,
      dto.pesoTotalMezclaGramos,
    );

    return this.recetaRepository.create({
      nombre: dto.nombre.trim(),
      pesoTotalMezclaGramos: dto.pesoTotalMezclaGramos,
      costoTotalLote,
      costoPorGramo,
      usuarioId: dto.usuarioId,
      insumos: dto.insumos,
    });
  }
}
