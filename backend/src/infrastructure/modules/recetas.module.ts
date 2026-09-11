import { Module } from '@nestjs/common';
import { ActualizarRecetaUseCase } from '../../application/use-cases/actualizar-receta.use-case';
import { CrearRecetaUseCase } from '../../application/use-cases/crear-receta.use-case';
import { EliminarRecetaUseCase } from '../../application/use-cases/eliminar-receta.use-case';
import { ObtenerRecetasUseCase } from '../../application/use-cases/obtener-recetas.use-case';
import { INSUMO_REPOSITORY_PORT } from '../../domain/ports/insumo-repository.port';
import { RECETA_REPOSITORY_PORT } from '../../domain/ports/receta-repository.port';
import { RecetasController } from '../controllers/recetas.controller';
import { PrismaInsumoRepositoryAdapter } from '../persistence/prisma/prisma-insumo-repository.adapter';
import { PrismaRecetaRepositoryAdapter } from '../persistence/prisma/prisma-receta-repository.adapter';
import { PrismaModule } from '../persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecetasController],
  providers: [
    {
      provide: RECETA_REPOSITORY_PORT,
      useClass: PrismaRecetaRepositoryAdapter,
    },
    {
      provide: INSUMO_REPOSITORY_PORT,
      useClass: PrismaInsumoRepositoryAdapter,
    },
    {
      provide: CrearRecetaUseCase,
      useFactory: (recetaRepo, insumoRepo) => new CrearRecetaUseCase(recetaRepo, insumoRepo),
      inject: [RECETA_REPOSITORY_PORT, INSUMO_REPOSITORY_PORT],
    },
    {
      provide: ObtenerRecetasUseCase,
      useFactory: (recetaRepo) => new ObtenerRecetasUseCase(recetaRepo),
      inject: [RECETA_REPOSITORY_PORT],
    },
    {
      provide: ActualizarRecetaUseCase,
      useFactory: (recetaRepo, insumoRepo) => new ActualizarRecetaUseCase(recetaRepo, insumoRepo),
      inject: [RECETA_REPOSITORY_PORT, INSUMO_REPOSITORY_PORT],
    },
    {
      provide: EliminarRecetaUseCase,
      useFactory: (recetaRepo) => new EliminarRecetaUseCase(recetaRepo),
      inject: [RECETA_REPOSITORY_PORT],
    },
  ],
  exports: [
    CrearRecetaUseCase,
    ObtenerRecetasUseCase,
    ActualizarRecetaUseCase,
    EliminarRecetaUseCase,
  ],
})
export class RecetasModule {}
