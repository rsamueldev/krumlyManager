import { RecetaRepositoryPort } from '../../domain/ports/receta-repository.port';

export class EliminarRecetaUseCase {
  constructor(private readonly recetaRepository: RecetaRepositoryPort) {}

  async execute(id: string): Promise<boolean> {
    const receta = await this.recetaRepository.findById(id);
    if (!receta) {
      throw new Error(`Receta con ID ${id} no fue encontrada`);
    }
    return this.recetaRepository.delete(id);
  }
}
