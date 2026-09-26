import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CLIENTE_REPOSITORY_PORT, ClienteRepositoryPort } from '../../../domain/ports/cliente-repository.port';

export interface CrearClienteInput {
  nombre: string;
  cedulaRif?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  activo?: boolean;
}

@Injectable()
export class CrearClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY_PORT)
    private readonly clienteRepo: ClienteRepositoryPort,
  ) {}

  async execute(input: CrearClienteInput) {
    if (!input.nombre || input.nombre.trim() === '') {
      throw new BadRequestException('El nombre o razón social del cliente es obligatorio.');
    }

    return this.clienteRepo.crear({
      nombre: input.nombre.trim(),
      cedulaRif: input.cedulaRif?.trim() || null,
      telefono: input.telefono?.trim() || null,
      ubicacion: input.ubicacion?.trim() || null,
      activo: input.activo ?? true,
    });
  }
}
