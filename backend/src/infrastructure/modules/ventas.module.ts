import { Module } from '@nestjs/common';
import { CrearVentaUseCase } from '../../application/use-cases/crear-venta.use-case';
import { EliminarVentaUseCase } from '../../application/use-cases/eliminar-venta.use-case';
import { ObtenerVentasUseCase } from '../../application/use-cases/obtener-ventas.use-case';
import { SincronizarVentasOfflineUseCase } from '../../application/use-cases/sincronizar-ventas-offline.use-case';
import { VENTA_REPOSITORY_PORT } from '../../domain/ports/venta-repository.port';
import { VentasController } from '../controllers/ventas.controller';
import { PrismaVentaRepositoryAdapter } from '../persistence/prisma/prisma-venta-repository.adapter';
import { PrismaModule } from '../persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VentasController],
  providers: [
    PrismaVentaRepositoryAdapter,
    {
      provide: VENTA_REPOSITORY_PORT,
      useExisting: PrismaVentaRepositoryAdapter,
    },
    CrearVentaUseCase,
    ObtenerVentasUseCase,
    SincronizarVentasOfflineUseCase,
    EliminarVentaUseCase,
  ],
  exports: [CrearVentaUseCase, ObtenerVentasUseCase, SincronizarVentasOfflineUseCase, EliminarVentaUseCase],
})
export class VentasModule {}
