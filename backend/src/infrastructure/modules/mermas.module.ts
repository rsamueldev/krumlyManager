import { Module } from '@nestjs/common';
import { MermasController } from '../controllers/mermas.controller';
import { RegistrarMermaUseCase } from '../../application/use-cases/mermas/registrar-merma.use-case';
import { ObtenerMermasUseCase } from '../../application/use-cases/mermas/obtener-mermas.use-case';
import { MERMAS_REPOSITORY_PORT } from '../../domain/ports/mermas-repository.port';
import { PrismaMermasRepositoryAdapter } from '../persistence/prisma/prisma-mermas-repository.adapter';
import { PrismaService } from '../persistence/prisma/prisma.service';

@Module({
  controllers: [MermasController],
  providers: [
    PrismaService,
    RegistrarMermaUseCase,
    ObtenerMermasUseCase,
    {
      provide: MERMAS_REPOSITORY_PORT,
      useClass: PrismaMermasRepositoryAdapter,
    },
  ],
  exports: [RegistrarMermaUseCase, ObtenerMermasUseCase],
})
export class MermasModule {}
