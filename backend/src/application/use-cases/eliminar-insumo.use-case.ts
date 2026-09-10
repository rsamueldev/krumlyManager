import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';

export class EliminarInsumoUseCase {
  constructor(private readonly insumoRepository: InsumoRepositoryPort) {}

  async execute(id: string): Promise<boolean> {
    const insumoExistente = await this.insumoRepository.findById(id);
    if (!insumoExistente) {
      throw new Error('Insumo no encontrado');
    }

    return this.insumoRepository.delete(id);
  }
}
