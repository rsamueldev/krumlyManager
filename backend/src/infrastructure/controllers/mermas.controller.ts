import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RegistrarMermaUseCase } from '../../application/use-cases/mermas/registrar-merma.use-case';
import { ObtenerMermasUseCase } from '../../application/use-cases/mermas/obtener-mermas.use-case';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class RegistrarMermaDto {
  productoId!: string;
  cantidad!: number;
  motivo!: string;
}

@Controller('mermas')
@UseGuards(JwtAuthGuard)
export class MermasController {
  constructor(
    private readonly registrarMermaUseCase: RegistrarMermaUseCase,
    private readonly obtenerMermasUseCase: ObtenerMermasUseCase,
  ) {}

  @Get()
  async obtenerHistorial(@Query('limit') limitStr?: string) {
    const limit = parseInt(limitStr || '50', 10);
    return this.obtenerMermasUseCase.execute(limit);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  async registrarMerma(@Req() req: any, @Body() dto: RegistrarMermaDto) {
    const usuarioId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.registrarMermaUseCase.execute({
      productoId: dto.productoId,
      cantidad: dto.cantidad,
      motivo: dto.motivo,
      usuarioId,
    });
  }
}
