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
  UseGuards,
} from '@nestjs/common';
import { ActualizarProductoUseCase } from '../../application/use-cases/actualizar-producto.use-case';
import { CrearProductoUseCase } from '../../application/use-cases/crear-producto.use-case';
import { EliminarProductoUseCase } from '../../application/use-cases/eliminar-producto.use-case';
import { ObtenerProductosUseCase } from '../../application/use-cases/obtener-productos.use-case';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CrearProductoDto {
  nombre!: string;
  categoriaId?: string;
  recetaId?: string;
  pesoMasaGramos?: number;
  costoInsumosAdicionales?: number;
  costoEmpaque?: number;
  costoManoObra?: number;
  costoDepreciacion?: number;
  porcentajeDesperdicio?: number;
  precioVenta!: number;
  stockActual?: number;
  stockMinimo?: number;
}

class ActualizarProductoDto {
  nombre?: string;
  categoriaId?: string;
  recetaId?: string;
  pesoMasaGramos?: number;
  costoInsumosAdicionales?: number;
  costoEmpaque?: number;
  costoManoObra?: number;
  costoDepreciacion?: number;
  porcentajeDesperdicio?: number;
  precioVenta?: number;
  stockActual?: number;
  stockMinimo?: number;
  activo?: boolean;
}

@Controller('productos')
@UseGuards(JwtAuthGuard)
export class ProductosController {
  constructor(
    private readonly crearProductoUseCase: CrearProductoUseCase,
    private readonly obtenerProductosUseCase: ObtenerProductosUseCase,
    private readonly actualizarProductoUseCase: ActualizarProductoUseCase,
    private readonly eliminarProductoUseCase: EliminarProductoUseCase,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  async create(@Body() dto: CrearProductoDto) {
    return this.crearProductoUseCase.execute(dto);
  }

  @Get()
  async findAll() {
    return this.obtenerProductosUseCase.executeAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.obtenerProductosUseCase.executeById(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  async update(@Param('id') id: string, @Body() dto: ActualizarProductoDto) {
    return this.actualizarProductoUseCase.execute(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eliminarProductoUseCase.execute(id);
  }
}
