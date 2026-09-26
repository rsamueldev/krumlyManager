import { Inject, Injectable } from '@nestjs/common';
import { GASTOS_REPOSITORY_PORT, GastosRepositoryPort } from '../../../domain/ports/gastos-repository.port';

@Injectable()
export class ObtenerGastosUseCase {
  constructor(
    @Inject(GASTOS_REPOSITORY_PORT)
    private readonly gastosRepo: GastosRepositoryPort,
  ) {}

  async execute(limit: number = 100) {
    return this.gastosRepo.obtenerGastos(limit);
  }
}
