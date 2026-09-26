import { Inject, Injectable } from '@nestjs/common';
import { PRODUCCION_REPOSITORY_PORT, ProduccionRepositoryPort } from '../../../domain/ports/produccion-repository.port';

@Injectable()
export class ObtenerHistorialLotesUseCase {
  constructor(
    @Inject(PRODUCCION_REPOSITORY_PORT)
    private readonly produccionRepo: ProduccionRepositoryPort,
  ) {}

  async execute(limit: number = 50) {
    return this.produccionRepo.obtenerHistorialLotes(limit);
  }
}
