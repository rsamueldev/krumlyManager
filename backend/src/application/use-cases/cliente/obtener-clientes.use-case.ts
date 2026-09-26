import { Inject, Injectable } from '@nestjs/common';
import { CLIENTE_REPOSITORY_PORT, ClienteRepositoryPort } from '../../../domain/ports/cliente-repository.port';

@Injectable()
export class ObtenerClientesUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY_PORT)
    private readonly clienteRepo: ClienteRepositoryPort,
  ) {}

  async executeAll(filtro?: { busqueda?: string; activo?: boolean }) {
    return this.clienteRepo.obtenerTodos(filtro);
  }

  async executeById(id: string) {
    return this.clienteRepo.obtenerPorId(id);
  }

  async executeByCedulaRif(cedulaRif: string) {
    return this.clienteRepo.obtenerPorCedulaRif(cedulaRif);
  }
}
