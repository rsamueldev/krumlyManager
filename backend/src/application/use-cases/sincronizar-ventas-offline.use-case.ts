import { Inject, Injectable } from '@nestjs/common';
import { VentaRepositoryPort, VENTA_REPOSITORY_PORT } from '../../domain/ports/venta-repository.port';

export interface VentaOfflineDto {
  codigoVenta?: string;
  clienteId?: string;
  totalVenta: number;
  fechaVenta?: string;
  detalles: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
  }>;
  pagos: Array<{
    metodoPago: string;
    montoUsd: number;
    montoVes?: number;
    tasaCambio?: number;
    referenciaPago?: string;
  }>;
}

@Injectable()
export class SincronizarVentasOfflineUseCase {
  constructor(
    @Inject(VENTA_REPOSITORY_PORT)
    private readonly ventaRepo: VentaRepositoryPort,
  ) {}

  async execute(usuarioId: string, ventasOffline: VentaOfflineDto[]) {
    if (!ventasOffline || ventasOffline.length === 0) {
      return [];
    }

    const payloadLote = ventasOffline.map((v) => ({
      ventaData: {
        codigoVenta: v.codigoVenta,
        clienteId: v.clienteId || undefined,
        totalVenta: v.totalVenta,
        fechaVenta: v.fechaVenta ? new Date(v.fechaVenta) : undefined,
        estadoSincronizacion: 'offline_synced' as any,
        usuarioId,
      },
      detalles: v.detalles,
      pagos: v.pagos,
    }));

    return this.ventaRepo.sincronizarLoteOffline(payloadLote);
  }
}
