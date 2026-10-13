import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  PRODUCCION_REPOSITORY_PORT,
  ProduccionRepositoryPort,
  HornearLoteInput,
} from '../../../domain/ports/produccion-repository.port';

@Injectable()
export class HornearLoteUseCase {
  constructor(
    @Inject(PRODUCCION_REPOSITORY_PORT)
    private readonly produccionRepo: ProduccionRepositoryPort,
  ) {}

  async execute(input: HornearLoteInput) {
    if (!input.productoId || input.productoId.trim() === '') {
      throw new BadRequestException('Debe seleccionar un producto o combo a hornear/empacar.');
    }
    if (!input.cantidad || input.cantidad <= 0) {
      throw new BadRequestException('La cantidad a hornear/empacar debe ser mayor a cero.');
    }
    if (!input.usuarioId || input.usuarioId.trim() === '') {
      throw new BadRequestException('ID de usuario no proporcionado.');
    }

    return this.produccionRepo.hornearLote({
      productoId: input.productoId,
      cantidad: Math.floor(input.cantidad),
      usuarioId: input.usuarioId,
      notas: input.notas,
      galletasSeleccionadas: input.galletasSeleccionadas,
    });
  }
}
