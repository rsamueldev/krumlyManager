import { CategoriaEntity, TipoCategoriaEnum } from '../../domain/entities/categoria.entity';
import { CategoriaRepositoryPort } from '../../domain/ports/categoria-repository.port';

export class ObtenerCategoriasUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepositoryPort) {}

  async executeAll(tipo?: TipoCategoriaEnum): Promise<CategoriaEntity[]> {
    return this.categoriaRepository.findAll(tipo);
  }

  async executeById(id: string): Promise<CategoriaEntity> {
    const categoria = await this.categoriaRepository.findById(id);
    if (!categoria) {
      throw new Error('Categoría no encontrada');
    }
    return categoria;
  }
}
