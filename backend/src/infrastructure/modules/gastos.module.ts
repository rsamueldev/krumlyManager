import { Module } from '@nestjs/common';
import { GastosController } from '../controllers/gastos.controller';
import { RegistrarGastoUseCase } from '../../application/use-cases/gastos/registrar-gasto.use-case';
import { ObtenerGastosUseCase } from '../../application/use-cases/gastos/obtener-gastos.use-case';
import { EliminarGastoUseCase } from '../../application/use-cases/gastos/eliminar-gasto.use-case';
import { GASTOS_REPOSITORY_PORT } from '../../domain/ports/gastos-repository.port';
import { PrismaGastosRepositoryAdapter } from '../persistence/prisma/prisma-gastos-repository.adapter';
import { PrismaService } from '../persistence/prisma/prisma.service';

@Module({
  controllers: [GastosController],
  providers: [
    PrismaService,
    RegistrarGastoUseCase,
    ObtenerGastosUseCase,
    EliminarGastoUseCase,
    {
      provide: GASTOS_REPOSITORY_PORT,
      useClass: PrismaGastosRepositoryAdapter,
    },
  ],
  exports: [RegistrarGastoUseCase, ObtenerGastosUseCase, EliminarGastoUseCase],
})
export class GastosModule {}
