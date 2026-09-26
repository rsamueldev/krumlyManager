import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RegistrarLoteUseCase } from '../../application/use-cases/produccion/registrar-lote.use-case';
import { SimularProduccionUseCase } from '../../application/use-cases/produccion/simular-produccion.use-case';
import { ObtenerHistorialLotesUseCase } from '../../application/use-cases/produccion/obtener-historial-lotes.use-case';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class RegistrarLoteDto {
  productoId!: string;
  cantidadProducida!: number;
  notas?: string;
}

@Controller('produccion')
@UseGuards(JwtAuthGuard)
export class ProduccionController {
  constructor(
    private readonly registrarLoteUseCase: RegistrarLoteUseCase,
    private readonly simularProduccionUseCase: SimularProduccionUseCase,
    private readonly obtenerHistorialLotesUseCase: ObtenerHistorialLotesUseCase,
  ) {}

  @Get('simular')
  async simular(
    @Query('productoId') productoId: string,
    @Query('cantidad') cantidadStr: string,
  ) {
    const cantidad = parseInt(cantidadStr, 10) || 1;
    return this.simularProduccionUseCase.execute(productoId, cantidad);
  }

  @Get('lotes')
  async obtenerHistorial(@Query('limit') limitStr?: string) {
    const limit = parseInt(limitStr || '50', 10);
    return this.obtenerHistorialLotesUseCase.execute(limit);
  }

  @Post('lotes')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  async registrarLote(@Req() req: any, @Body() dto: RegistrarLoteDto) {
    const usuarioId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.registrarLoteUseCase.execute({
      productoId: dto.productoId,
      cantidadProducida: dto.cantidadProducida,
      usuarioId,
      notas: dto.notas,
    });
  }
}
