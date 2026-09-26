import { Inject, Injectable } from '@nestjs/common';
import { CLIENTE_REPOSITORY_PORT, ClienteRepositoryPort } from '../../../domain/ports/cliente-repository.port';

@Injectable()
export class ToggleActivoClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY_PORT)
    private readonly clienteRepo: ClienteRepositoryPort,
  ) {}

  async execute(id: string, activo?: boolean) {
    return this.clienteRepo.toggleActivo(id, activo);
  }
}
