import { Inject, Injectable } from '@nestjs/common';
import { VentaRepositoryPort, VENTA_REPOSITORY_PORT } from '../../domain/ports/venta-repository.port';

@Injectable()
export class ObtenerVentasUseCase {
  constructor(
    @Inject(VENTA_REPOSITORY_PORT)
    private readonly ventaRepo: VentaRepositoryPort,
  ) {}

  async executeAll() {
    return this.ventaRepo.obtenerTodas();
  }

  async executeById(id: string) {
    return this.ventaRepo.obtenerPorId(id);
  }
}
