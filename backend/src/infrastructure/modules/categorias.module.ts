import { Module } from '@nestjs/common';
import { ActualizarCategoriaUseCase } from '../../application/use-cases/actualizar-categoria.use-case';
import { CrearCategoriaUseCase } from '../../application/use-cases/crear-categoria.use-case';
import { EliminarCategoriaUseCase } from '../../application/use-cases/eliminar-categoria.use-case';
import { ObtenerCategoriasUseCase } from '../../application/use-cases/obtener-categorias.use-case';
import { CATEGORIA_REPOSITORY_PORT } from '../../domain/ports/categoria-repository.port';
import { CategoriasController } from '../controllers/categorias.controller';
import { PrismaCategoriaRepositoryAdapter } from '../persistence/prisma/prisma-categoria-repository.adapter';
import { PrismaModule } from '../persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriasController],
  providers: [
    {
      provide: CATEGORIA_REPOSITORY_PORT,
      useClass: PrismaCategoriaRepositoryAdapter,
    },
    {
      provide: CrearCategoriaUseCase,
      useFactory: (repo) => new CrearCategoriaUseCase(repo),
      inject: [CATEGORIA_REPOSITORY_PORT],
    },
    {
      provide: ObtenerCategoriasUseCase,
      useFactory: (repo) => new ObtenerCategoriasUseCase(repo),
      inject: [CATEGORIA_REPOSITORY_PORT],
    },
    {
      provide: ActualizarCategoriaUseCase,
      useFactory: (repo) => new ActualizarCategoriaUseCase(repo),
      inject: [CATEGORIA_REPOSITORY_PORT],
    },
    {
      provide: EliminarCategoriaUseCase,
      useFactory: (repo) => new EliminarCategoriaUseCase(repo),
      inject: [CATEGORIA_REPOSITORY_PORT],
    },
  ],
  exports: [
    CrearCategoriaUseCase,
    ObtenerCategoriasUseCase,
    ActualizarCategoriaUseCase,
    EliminarCategoriaUseCase,
  ],
})
export class CategoriasModule {}
