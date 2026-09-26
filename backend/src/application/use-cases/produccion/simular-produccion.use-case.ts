import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PRODUCCION_REPOSITORY_PORT, ProduccionRepositoryPort } from '../../../domain/ports/produccion-repository.port';

@Injectable()
export class SimularProduccionUseCase {
  constructor(
    @Inject(PRODUCCION_REPOSITORY_PORT)
    private readonly produccionRepo: ProduccionRepositoryPort,
  ) {}

  async execute(productoId: string, cantidadAProducir: number) {
    if (!productoId || productoId.trim() === '') {
      throw new BadRequestException('El ID del producto es obligatorio.');
    }
    if (!cantidadAProducir || cantidadAProducir <= 0) {
      throw new BadRequestException('La cantidad a simular debe ser mayor a cero.');
    }

    return this.produccionRepo.simularProduccion(productoId, Math.floor(cantidadAProducir));
  }
}
