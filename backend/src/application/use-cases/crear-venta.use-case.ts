import { Inject, Injectable } from '@nestjs/common';
import { VentaRepositoryPort, VENTA_REPOSITORY_PORT } from '../../domain/ports/venta-repository.port';

@Injectable()
export class CrearVentaUseCase {
  constructor(
    @Inject(VENTA_REPOSITORY_PORT)
    private readonly ventaRepo: VentaRepositoryPort,
  ) {}

  async execute(dto: {
    clienteId?: string;
    usuarioId: string;
    totalVenta: number;
    estadoSincronizacion?: any;
    detalles: any[];
    pagos: any[];
  }) {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new Error('La venta debe incluir al menos un producto.');
    }
    if (!dto.pagos || dto.pagos.length === 0) {
      throw new Error('Debe especificar al menos un método de pago.');
    }

    return this.ventaRepo.crearVenta(
      {
        clienteId: dto.clienteId || undefined,
        totalVenta: dto.totalVenta,
        usuarioId: dto.usuarioId,
        estadoSincronizacion: dto.estadoSincronizacion || 'online',
      },
      dto.detalles,
      dto.pagos,
    );
  }
}
