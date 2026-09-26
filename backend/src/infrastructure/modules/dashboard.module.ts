import { Module } from '@nestjs/common';
import { DashboardController } from '../controllers/dashboard.controller';
import { ObtenerDashboardMetricsUseCase } from '../../application/use-cases/dashboard/obtener-dashboard-metrics.use-case';
import { PrismaService } from '../persistence/prisma/prisma.service';

@Module({
  controllers: [DashboardController],
  providers: [PrismaService, ObtenerDashboardMetricsUseCase],
  exports: [ObtenerDashboardMetricsUseCase],
})
export class DashboardModule {}
