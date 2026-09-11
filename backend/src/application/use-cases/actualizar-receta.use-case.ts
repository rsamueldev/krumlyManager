import { RecetaEntity } from '../../domain/entities/receta.entity';
import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';
import { RecetaRepositoryPort } from '../../domain/ports/receta-repository.port';
import { InsumoRecetaInput } from './crear-receta.use-case';

export interface ActualizarRecetaDto {
  nombre?: string;
  pesoTotalMezclaGramos?: number;
  insumos?: InsumoRecetaInput[];
}

export class ActualizarRecetaUseCase {
  constructor(
    private readonly recetaRepository: RecetaRepositoryPort,
    private readonly insumoRepository: InsumoRepositoryPort,
  ) {}

  async execute(id: string, dto: ActualizarRecetaDto): Promise<RecetaEntity> {
    const recetaExistente = await this.recetaRepository.findById(id);
    if (!recetaExistente) {
      throw new Error(`Receta con ID ${id} no fue encontrada`);
    }

    const pesoTotal = dto.pesoTotalMezclaGramos ?? recetaExistente.pesoTotalMezclaGramos;
    const insumosTarget = dto.insumos ?? recetaExistente.insumos.map((i) => ({
      insumoId: i.insumoId,
      cantidad: i.cantidad,
    }));

    const insumosConDetalle = await Promise.all(
      insumosTarget.map(async (item) => {
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
      pesoTotal,
    );

    return this.recetaRepository.update(id, {
      nombre: dto.nombre ? dto.nombre.trim() : undefined,
      pesoTotalMezclaGramos: pesoTotal,
      costoTotalLote,
      costoPorGramo,
      insumos: dto.insumos,
    });
  }
}
