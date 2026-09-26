import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { CLIENTE_REPOSITORY_PORT } from '../../domain/ports/cliente-repository.port';
import { PrismaClienteRepositoryAdapter } from '../persistence/prisma/prisma-cliente-repository.adapter';
import { CrearClienteUseCase } from '../../application/use-cases/cliente/crear-cliente.use-case';
import { ObtenerClientesUseCase } from '../../application/use-cases/cliente/obtener-clientes.use-case';
import { ActualizarClienteUseCase } from '../../application/use-cases/cliente/actualizar-cliente.use-case';
import { ToggleActivoClienteUseCase } from '../../application/use-cases/cliente/toggle-activo-cliente.use-case';
import { ClientesController } from '../controllers/clientes.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ClientesController],
  providers: [
    {
      provide: CLIENTE_REPOSITORY_PORT,
      useClass: PrismaClienteRepositoryAdapter,
    },
    CrearClienteUseCase,
    ObtenerClientesUseCase,
    ActualizarClienteUseCase,
    ToggleActivoClienteUseCase,
  ],
  exports: [
    CrearClienteUseCase,
    ObtenerClientesUseCase,
    ActualizarClienteUseCase,
    ToggleActivoClienteUseCase,
  ],
})
export class ClientesModule {}
