import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CrearClienteUseCase } from '../../application/use-cases/cliente/crear-cliente.use-case';
import { ObtenerClientesUseCase } from '../../application/use-cases/cliente/obtener-clientes.use-case';
import { ActualizarClienteUseCase } from '../../application/use-cases/cliente/actualizar-cliente.use-case';
import { ToggleActivoClienteUseCase } from '../../application/use-cases/cliente/toggle-activo-cliente.use-case';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CrearClienteDto {
  nombre!: string;
  cedulaRif?: string;
  telefono?: string;
  ubicacion?: string;
  activo?: boolean;
}

class ActualizarClienteDto {
  nombre?: string;
  cedulaRif?: string;
  telefono?: string;
  ubicacion?: string;
  activo?: boolean;
}

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(
    private readonly crearClienteUseCase: CrearClienteUseCase,
    private readonly obtenerClientesUseCase: ObtenerClientesUseCase,
    private readonly actualizarClienteUseCase: ActualizarClienteUseCase,
    private readonly toggleActivoClienteUseCase: ToggleActivoClienteUseCase,
  ) {}

  @Get()
  async findAll(
    @Query('busqueda') busqueda?: string,
    @Query('activo') activoStr?: string,
  ) {
    let activo: boolean | undefined = undefined;
    if (activoStr === 'true') activo = true;
    if (activoStr === 'false') activo = false;

    return this.obtenerClientesUseCase.executeAll({ busqueda, activo });
  }

  @Get('cedula/:cedula')
  async findByCedulaRif(@Param('cedula') cedula: string) {
    return this.obtenerClientesUseCase.executeByCedulaRif(cedula);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.obtenerClientesUseCase.executeById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  async create(@Body() dto: CrearClienteDto) {
    return this.crearClienteUseCase.execute(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  async update(@Param('id') id: string, @Body() dto: ActualizarClienteDto) {
    return this.actualizarClienteUseCase.execute(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async toggleActivo(@Param('id') id: string, @Body('activo') activo?: boolean) {
    return this.toggleActivoClienteUseCase.execute(id, activo);
  }
}
