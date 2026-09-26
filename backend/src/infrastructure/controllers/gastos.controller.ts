import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RegistrarGastoUseCase } from '../../application/use-cases/gastos/registrar-gasto.use-case';
import { ObtenerGastosUseCase } from '../../application/use-cases/gastos/obtener-gastos.use-case';
import { EliminarGastoUseCase } from '../../application/use-cases/gastos/eliminar-gasto.use-case';
import { TipoGastoEnum } from '../../domain/entities/gasto.entity';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class RegistrarGastoDto {
  tipoGasto!: TipoGastoEnum;
  concepto!: string;
  montoUsd!: number;
  montoVes?: number;
  tasaCambio?: number;
  metodoPago?: string;
  fechaGasto?: string;
  categoriaId?: string;
}

@Controller('gastos')
@UseGuards(JwtAuthGuard)
export class GastosController {
  constructor(
    private readonly registrarGastoUseCase: RegistrarGastoUseCase,
    private readonly obtenerGastosUseCase: ObtenerGastosUseCase,
    private readonly eliminarGastoUseCase: EliminarGastoUseCase,
  ) {}

  @Get()
  async obtenerGastos(@Query('limit') limitStr?: string) {
    const limit = parseInt(limitStr || '100', 10);
    return this.obtenerGastosUseCase.execute(limit);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async registrarGasto(@Req() req: any, @Body() dto: RegistrarGastoDto) {
    const usuarioId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.registrarGastoUseCase.execute({
      tipoGasto: dto.tipoGasto,
      concepto: dto.concepto,
      montoUsd: dto.montoUsd,
      montoVes: dto.montoVes,
      tasaCambio: dto.tasaCambio,
      metodoPago: dto.metodoPago,
      fechaGasto: dto.fechaGasto,
      categoriaId: dto.categoriaId,
      usuarioId,
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async eliminarGasto(@Param('id') id: string) {
    return this.eliminarGastoUseCase.execute(id);
  }
}
