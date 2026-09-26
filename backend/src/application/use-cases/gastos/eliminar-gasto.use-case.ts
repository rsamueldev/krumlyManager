import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { GASTOS_REPOSITORY_PORT, GastosRepositoryPort } from '../../../domain/ports/gastos-repository.port';

@Injectable()
export class EliminarGastoUseCase {
  constructor(
    @Inject(GASTOS_REPOSITORY_PORT)
    private readonly gastosRepo: GastosRepositoryPort,
  ) {}

  async execute(id: string) {
    if (!id || id.trim() === '') {
      throw new BadRequestException('ID de gasto inválido.');
    }
    return this.gastosRepo.eliminarGasto(id);
  }
}
