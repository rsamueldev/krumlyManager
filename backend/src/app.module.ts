import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './infrastructure/auth/auth.module';
import { CategoriasModule } from './infrastructure/modules/categorias.module';
import { InsumosModule } from './infrastructure/modules/insumos.module';
import { ProductosModule } from './infrastructure/modules/productos.module';
import { RecetasModule } from './infrastructure/modules/recetas.module';
import { VentasModule } from './infrastructure/modules/ventas.module';
import { ClientesModule } from './infrastructure/modules/clientes.module';
import { ProduccionModule } from './infrastructure/modules/produccion.module';
import { MermasModule } from './infrastructure/modules/mermas.module';
import { GastosModule } from './infrastructure/modules/gastos.module';
import { DashboardModule } from './infrastructure/modules/dashboard.module';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    InsumosModule,
    RecetasModule,
    ProductosModule,
    CategoriasModule,
    VentasModule,
    ClientesModule,
    ProduccionModule,
    MermasModule,
    GastosModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
