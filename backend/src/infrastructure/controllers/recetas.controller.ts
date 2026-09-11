import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ActualizarRecetaUseCase } from '../../application/use-cases/actualizar-receta.use-case';
import { CrearRecetaUseCase, InsumoRecetaInput } from '../../application/use-cases/crear-receta.use-case';
import { EliminarRecetaUseCase } from '../../application/use-cases/eliminar-receta.use-case';
import { ObtenerRecetasUseCase } from '../../application/use-cases/obtener-recetas.use-case';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CrearRecetaDto {
  nombre!: string;
  pesoTotalMezclaGramos!: number;
  insumos!: InsumoRecetaInput[];
}

class ActualizarRecetaDto {
  nombre?: string;
  pesoTotalMezclaGramos?: number;
  insumos?: InsumoRecetaInput[];
}

@Controller('recetas')
@UseGuards(JwtAuthGuard)
export class RecetasController {
  constructor(
    private readonly crearRecetaUseCase: CrearRecetaUseCase,
    private readonly obtenerRecetasUseCase: ObtenerRecetasUseCase,
    private readonly actualizarRecetaUseCase: ActualizarRecetaUseCase,
    private readonly eliminarRecetaUseCase: EliminarRecetaUseCase,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async create(@Request() req: any, @Body() dto: CrearRecetaDto) {
    const usuarioId = req.user?.userId || req.user?.sub;
    return this.crearRecetaUseCase.execute({
      ...dto,
      usuarioId,
    });
  }

  @Get()
  async findAll() {
    return this.obtenerRecetasUseCase.executeAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.obtenerRecetasUseCase.executeById(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async update(@Param('id') id: string, @Body() dto: ActualizarRecetaDto) {
    return this.actualizarRecetaUseCase.execute(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eliminarRecetaUseCase.execute(id);
  }
}
