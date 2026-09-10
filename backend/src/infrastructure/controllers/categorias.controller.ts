import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ActualizarCategoriaUseCase } from '../../application/use-cases/actualizar-categoria.use-case';
import { CrearCategoriaUseCase } from '../../application/use-cases/crear-categoria.use-case';
import { EliminarCategoriaUseCase } from '../../application/use-cases/eliminar-categoria.use-case';
import { ObtenerCategoriasUseCase } from '../../application/use-cases/obtener-categorias.use-case';
import { TipoCategoriaEnum } from '../../domain/entities/categoria.entity';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CrearCategoriaDto {
  nombre!: string;
  tipo!: TipoCategoriaEnum;
}

class ActualizarCategoriaDto {
  nombre?: string;
  tipo?: TipoCategoriaEnum;
}

@Controller('categorias')
@UseGuards(JwtAuthGuard)
export class CategoriasController {
  constructor(
    private readonly crearCategoriaUseCase: CrearCategoriaUseCase,
    private readonly obtenerCategoriasUseCase: ObtenerCategoriasUseCase,
    private readonly actualizarCategoriaUseCase: ActualizarCategoriaUseCase,
    private readonly eliminarCategoriaUseCase: EliminarCategoriaUseCase,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async create(@Body() dto: CrearCategoriaDto) {
    return this.crearCategoriaUseCase.execute(dto);
  }

  @Get()
  async findAll(@Query('tipo') tipo?: TipoCategoriaEnum) {
    return this.obtenerCategoriasUseCase.executeAll(tipo);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.obtenerCategoriasUseCase.executeById(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async update(@Param('id') id: string, @Body() dto: ActualizarCategoriaDto) {
    return this.actualizarCategoriaUseCase.execute(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eliminarCategoriaUseCase.execute(id);
  }
}
