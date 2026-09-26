import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CLIENTE_REPOSITORY_PORT, ClienteRepositoryPort } from '../../../domain/ports/cliente-repository.port';

export interface ActualizarClienteInput {
  nombre?: string;
  cedulaRif?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  activo?: boolean;
}

@Injectable()
export class ActualizarClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY_PORT)
    private readonly clienteRepo: ClienteRepositoryPort,
  ) {}

  async execute(id: string, input: ActualizarClienteInput) {
    if (input.nombre !== undefined && input.nombre.trim() === '') {
      throw new BadRequestException('El nombre o razón social no puede estar vacío.');
    }

    return this.clienteRepo.actualizar(id, {
      nombre: input.nombre?.trim(),
      cedulaRif: input.cedulaRif !== undefined ? (input.cedulaRif?.trim() || null) : undefined,
      telefono: input.telefono !== undefined ? (input.telefono?.trim() || null) : undefined,
      ubicacion: input.ubicacion !== undefined ? (input.ubicacion?.trim() || null) : undefined,
      activo: input.activo,
    });
  }
}
