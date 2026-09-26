import { Controller, Get, UseGuards } from '@nestjs/common';
import { ObtenerDashboardMetricsUseCase } from '../../application/use-cases/dashboard/obtener-dashboard-metrics.use-case';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly obtenerDashboardMetricsUseCase: ObtenerDashboardMetricsUseCase,
  ) {}

  @Get('metrics')
  async getMetrics() {
    return this.obtenerDashboardMetricsUseCase.execute();
  }
}
