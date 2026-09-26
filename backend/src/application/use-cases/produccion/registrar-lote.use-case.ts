import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PRODUCCION_REPOSITORY_PORT, ProduccionRepositoryPort } from '../../../domain/ports/produccion-repository.port';

export interface RegistrarLoteInput {
  productoId: string;
  cantidadProducida: number;
  usuarioId: string;
  notas?: string;
}

@Injectable()
export class RegistrarLoteUseCase {
  constructor(
    @Inject(PRODUCCION_REPOSITORY_PORT)
    private readonly produccionRepo: ProduccionRepositoryPort,
  ) {}

  async execute(input: RegistrarLoteInput) {
    if (!input.productoId || input.productoId.trim() === '') {
      throw new BadRequestException('Debe seleccionar un producto.');
    }
    if (!input.cantidadProducida || input.cantidadProducida <= 0) {
      throw new BadRequestException('La cantidad a producir debe ser mayor a cero.');
    }

    return this.produccionRepo.registrarLote({
      productoId: input.productoId,
      cantidadProducida: Math.floor(input.cantidadProducida),
      usuarioId: input.usuarioId,
      notas: input.notas,
    });
  }
}
