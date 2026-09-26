import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MERMAS_REPOSITORY_PORT, MermasRepositoryPort } from '../../../domain/ports/mermas-repository.port';

export interface RegistrarMermaInput {
  productoId: string;
  cantidad: number;
  motivo: string;
  usuarioId: string;
}

@Injectable()
export class RegistrarMermaUseCase {
  constructor(
    @Inject(MERMAS_REPOSITORY_PORT)
    private readonly mermasRepo: MermasRepositoryPort,
  ) {}

  async execute(input: RegistrarMermaInput) {
    if (!input.productoId || input.productoId.trim() === '') {
      throw new BadRequestException('Debe seleccionar un producto.');
    }
    if (!input.cantidad || input.cantidad <= 0) {
      throw new BadRequestException('La cantidad a descartar debe ser mayor a cero.');
    }
    if (!input.motivo || input.motivo.trim() === '') {
      throw new BadRequestException('Debe especificar un motivo para el descarte.');
    }

    return this.mermasRepo.registrarMerma({
      productoId: input.productoId,
      cantidad: Math.floor(input.cantidad),
      motivo: input.motivo.trim(),
      usuarioId: input.usuarioId,
    });
  }
}
