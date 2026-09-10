import { CategoriaRepositoryPort } from '../../domain/ports/categoria-repository.port';

export class EliminarCategoriaUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepositoryPort) {}

  async execute(id: string): Promise<boolean> {
    const categoriaExistente = await this.categoriaRepository.findById(id);
    if (!categoriaExistente) {
      throw new Error('Categoría no encontrada');
    }

    return this.categoriaRepository.delete(id);
  }
}
