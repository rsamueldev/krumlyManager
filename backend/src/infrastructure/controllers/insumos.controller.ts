import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ActualizarInsumoUseCase } from '../../application/use-cases/actualizar-insumo.use-case';
import { CrearInsumoUseCase } from '../../application/use-cases/crear-insumo.use-case';
import { EliminarInsumoUseCase } from '../../application/use-cases/eliminar-insumo.use-case';
import { ObtenerInsumosUseCase } from '../../application/use-cases/obtener-insumos.use-case';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { UnidadMedidaEnum } from '../../domain/entities/insumo.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CrearInsumoDto {
  nombre!: string;
  unidadMedida!: UnidadMedidaEnum;
  cantidadEmpaque!: number;
  precioCompra!: number;
  stockActual?: number;
  stockMinimo?: number;
}

class ActualizarInsumoDto {
  nombre?: string;
  unidadMedida?: UnidadMedidaEnum;
  cantidadEmpaque?: number;
  precioCompra?: number;
  stockActual?: number;
  stockMinimo?: number;
}

@Controller('insumos')
@UseGuards(JwtAuthGuard)
export class InsumosController {
  constructor(
    private readonly crearInsumoUseCase: CrearInsumoUseCase,
    private readonly obtenerInsumosUseCase: ObtenerInsumosUseCase,
    private readonly actualizarInsumoUseCase: ActualizarInsumoUseCase,
    private readonly eliminarInsumoUseCase: EliminarInsumoUseCase,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async create(@Body() dto: CrearInsumoDto) {
    return this.crearInsumoUseCase.execute(dto);
  }

  @Get()
  async findAll() {
    return this.obtenerInsumosUseCase.executeAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.obtenerInsumosUseCase.executeById(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async update(@Param('id') id: string, @Body() dto: ActualizarInsumoDto) {
    return this.actualizarInsumoUseCase.execute(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eliminarInsumoUseCase.execute(id);
  }
}
