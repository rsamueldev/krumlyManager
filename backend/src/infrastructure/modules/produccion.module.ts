import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { PRODUCCION_REPOSITORY_PORT } from '../../domain/ports/produccion-repository.port';
import { PrismaProduccionRepositoryAdapter } from '../persistence/prisma/prisma-produccion-repository.adapter';
import { RegistrarLoteUseCase } from '../../application/use-cases/produccion/registrar-lote.use-case';
import { SimularProduccionUseCase } from '../../application/use-cases/produccion/simular-produccion.use-case';
import { ObtenerHistorialLotesUseCase } from '../../application/use-cases/produccion/obtener-historial-lotes.use-case';
import { ProduccionController } from '../controllers/produccion.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProduccionController],
  providers: [
    {
      provide: PRODUCCION_REPOSITORY_PORT,
      useClass: PrismaProduccionRepositoryAdapter,
    },
    RegistrarLoteUseCase,
    SimularProduccionUseCase,
    ObtenerHistorialLotesUseCase,
  ],
  exports: [
    RegistrarLoteUseCase,
    SimularProduccionUseCase,
    ObtenerHistorialLotesUseCase,
  ],
})
export class ProduccionModule {}
