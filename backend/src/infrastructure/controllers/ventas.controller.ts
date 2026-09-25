import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CrearVentaUseCase } from '../../application/use-cases/crear-venta.use-case';
import { ObtenerVentasUseCase } from '../../application/use-cases/obtener-ventas.use-case';
import { RolUsuario } from '../../domain/entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class CrearVentaDto {
  clienteId?: string;
  totalVenta!: number;
  estadoSincronizacion?: string;
  detalles!: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
  }>;
  pagos!: Array<{
    metodoPago: string;
    montoUsd: number;
    montoVes?: number;
    tasaCambio?: number;
    referenciaPago?: string;
  }>;
}

@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(
    private readonly crearVentaUseCase: CrearVentaUseCase,
    private readonly obtenerVentasUseCase: ObtenerVentasUseCase,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  async create(@Req() req: any, @Body() dto: CrearVentaDto) {
    const usuarioId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.crearVentaUseCase.execute({
      ...dto,
      usuarioId,
    });
  }

  @Get()
  async findAll() {
    return this.obtenerVentasUseCase.executeAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.obtenerVentasUseCase.executeById(id);
  }
}
