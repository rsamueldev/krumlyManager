import { InsumoEntity } from '../../domain/entities/insumo.entity';
import { InsumoRepositoryPort } from '../../domain/ports/insumo-repository.port';

export class ObtenerInsumosUseCase {
  constructor(private readonly insumoRepository: InsumoRepositoryPort) {}

  async executeAll(): Promise<InsumoEntity[]> {
    return this.insumoRepository.findAll();
  }

  async executeById(id: string): Promise<InsumoEntity> {
    const insumo = await this.insumoRepository.findById(id);
    if (!insumo) {
      throw new Error('Insumo no encontrado');
    }
    return insumo;
  }
}
