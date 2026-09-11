import { Module } from '@nestjs/common';
import { ActualizarProductoUseCase } from '../../application/use-cases/actualizar-producto.use-case';
import { CrearProductoUseCase } from '../../application/use-cases/crear-producto.use-case';
import { EliminarProductoUseCase } from '../../application/use-cases/eliminar-producto.use-case';
import { ObtenerProductosUseCase } from '../../application/use-cases/obtener-productos.use-case';
import { INSUMO_REPOSITORY_PORT } from '../../domain/ports/insumo-repository.port';
import { PRODUCTO_REPOSITORY_PORT } from '../../domain/ports/producto-repository.port';
import { RECETA_REPOSITORY_PORT } from '../../domain/ports/receta-repository.port';
import { ProductosController } from '../controllers/productos.controller';
import { PrismaInsumoRepositoryAdapter } from '../persistence/prisma/prisma-insumo-repository.adapter';
import { PrismaProductoRepositoryAdapter } from '../persistence/prisma/prisma-producto-repository.adapter';
import { PrismaRecetaRepositoryAdapter } from '../persistence/prisma/prisma-receta-repository.adapter';
import { PrismaModule } from '../persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductosController],
  providers: [
    {
      provide: PRODUCTO_REPOSITORY_PORT,
      useClass: PrismaProductoRepositoryAdapter,
    },
    {
      provide: RECETA_REPOSITORY_PORT,
      useClass: PrismaRecetaRepositoryAdapter,
    },
    {
      provide: INSUMO_REPOSITORY_PORT,
      useClass: PrismaInsumoRepositoryAdapter,
    },
    {
      provide: CrearProductoUseCase,
      useFactory: (prodRepo, recetaRepo, insumoRepo) => new CrearProductoUseCase(prodRepo, recetaRepo, insumoRepo),
      inject: [PRODUCTO_REPOSITORY_PORT, RECETA_REPOSITORY_PORT, INSUMO_REPOSITORY_PORT],
    },
    {
      provide: ObtenerProductosUseCase,
      useFactory: (prodRepo) => new ObtenerProductosUseCase(prodRepo),
      inject: [PRODUCTO_REPOSITORY_PORT],
    },
    {
      provide: ActualizarProductoUseCase,
      useFactory: (prodRepo, recetaRepo, insumoRepo) => new ActualizarProductoUseCase(prodRepo, recetaRepo, insumoRepo),
      inject: [PRODUCTO_REPOSITORY_PORT, RECETA_REPOSITORY_PORT, INSUMO_REPOSITORY_PORT],
    },
    {
      provide: EliminarProductoUseCase,
      useFactory: (prodRepo) => new EliminarProductoUseCase(prodRepo),
      inject: [PRODUCTO_REPOSITORY_PORT],
    },
  ],
  exports: [
    CrearProductoUseCase,
    ObtenerProductosUseCase,
    ActualizarProductoUseCase,
    EliminarProductoUseCase,
  ],
})
export class ProductosModule {}
