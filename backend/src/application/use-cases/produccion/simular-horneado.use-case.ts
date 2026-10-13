import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  PRODUCCION_REPOSITORY_PORT,
  ProduccionRepositoryPort,
  SimularHorneadoResultado,
} from '../../../domain/ports/produccion-repository.port';

@Injectable()
export class SimularHorneadoUseCase {
  constructor(
    @Inject(PRODUCCION_REPOSITORY_PORT)
    private readonly produccionRepo: ProduccionRepositoryPort,
  ) {}

  async execute(
    productoId: string,
    cantidad: number,
    galletasSeleccionadas?: Array<{ productoId: string; cantidad: number }>,
  ): Promise<SimularHorneadoResultado> {
    if (!productoId || productoId.trim() === '') {
      throw new BadRequestException('ID de producto no válido.');
    }
    if (!cantidad || cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a cero.');
    }

    return this.produccionRepo.simularHorneado(productoId, cantidad, galletasSeleccionadas);
  }
}
