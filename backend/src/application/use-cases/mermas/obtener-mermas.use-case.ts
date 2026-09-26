import { Inject, Injectable } from '@nestjs/common';
import { MERMAS_REPOSITORY_PORT, MermasRepositoryPort } from '../../../domain/ports/mermas-repository.port';

@Injectable()
export class ObtenerMermasUseCase {
  constructor(
    @Inject(MERMAS_REPOSITORY_PORT)
    private readonly mermasRepo: MermasRepositoryPort,
  ) {}

  async execute(limit: number = 50) {
    return this.mermasRepo.obtenerHistorialMermas(limit);
  }
}
