import { RecetaEntity } from '../../domain/entities/receta.entity';
import { RecetaRepositoryPort } from '../../domain/ports/receta-repository.port';

export class ObtenerRecetasUseCase {
  constructor(private readonly recetaRepository: RecetaRepositoryPort) {}

  async executeAll(): Promise<RecetaEntity[]> {
    return this.recetaRepository.findAll();
  }

  async executeById(id: string): Promise<RecetaEntity | null> {
    const receta = await this.recetaRepository.findById(id);
    if (!receta) {
      throw new Error(`Receta con ID ${id} no fue encontrada`);
    }
    return receta;
  }
}
