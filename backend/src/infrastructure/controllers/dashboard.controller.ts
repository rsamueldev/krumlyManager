import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ObtenerDashboardMetricsUseCase } from '../../application/use-cases/dashboard/obtener-dashboard-metrics.use-case';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly obtenerDashboardMetricsUseCase: ObtenerDashboardMetricsUseCase,
  ) {}

  @Get('metrics')
  async getMetrics(
    @Query('periodo') periodo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.obtenerDashboardMetricsUseCase.execute(periodo, desde, hasta);
  }
}
