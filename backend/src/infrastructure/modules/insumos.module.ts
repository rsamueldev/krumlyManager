import { Module } from '@nestjs/common';
import { ActualizarInsumoUseCase } from '../../application/use-cases/actualizar-insumo.use-case';
import { CrearInsumoUseCase } from '../../application/use-cases/crear-insumo.use-case';
import { EliminarInsumoUseCase } from '../../application/use-cases/eliminar-insumo.use-case';
import { ObtenerInsumosUseCase } from '../../application/use-cases/obtener-insumos.use-case';
import { INSUMO_REPOSITORY_PORT } from '../../domain/ports/insumo-repository.port';
import { InsumosController } from '../controllers/insumos.controller';
import { PrismaInsumoRepositoryAdapter } from '../persistence/prisma/prisma-insumo-repository.adapter';
import { PrismaModule } from '../persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InsumosController],
  providers: [
    {
      provide: INSUMO_REPOSITORY_PORT,
      useClass: PrismaInsumoRepositoryAdapter,
    },
    {
      provide: CrearInsumoUseCase,
      useFactory: (repo) => new CrearInsumoUseCase(repo),
      inject: [INSUMO_REPOSITORY_PORT],
    },
    {
      provide: ObtenerInsumosUseCase,
      useFactory: (repo) => new ObtenerInsumosUseCase(repo),
      inject: [INSUMO_REPOSITORY_PORT],
    },
    {
      provide: ActualizarInsumoUseCase,
      useFactory: (repo) => new ActualizarInsumoUseCase(repo),
      inject: [INSUMO_REPOSITORY_PORT],
    },
    {
      provide: EliminarInsumoUseCase,
      useFactory: (repo) => new EliminarInsumoUseCase(repo),
      inject: [INSUMO_REPOSITORY_PORT],
    },
  ],
  exports: [
    CrearInsumoUseCase,
    ObtenerInsumosUseCase,
    ActualizarInsumoUseCase,
    EliminarInsumoUseCase,
  ],
})
export class InsumosModule {}
