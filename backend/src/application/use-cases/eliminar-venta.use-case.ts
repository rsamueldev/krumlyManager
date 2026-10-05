import { Inject, Injectable } from '@nestjs/common';
import { VentaRepositoryPort, VENTA_REPOSITORY_PORT } from '../../domain/ports/venta-repository.port';

@Injectable()
export class EliminarVentaUseCase {
  constructor(
    @Inject(VENTA_REPOSITORY_PORT)
    private readonly ventaRepo: VentaRepositoryPort,
  ) {}

  async execute(id: string): Promise<{ success: boolean; message: string }> {
    await this.ventaRepo.eliminarVenta(id);
    return {
      success: true,
      message: 'Venta eliminada y stock restaurado exitosamente',
    };
  }
}
