import {
  BadRequestException,
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
import { SincronizarVentasOfflineUseCase, VentaOfflineDto } from '../../application/use-cases/sincronizar-ventas-offline.use-case';
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
    private readonly sincronizarVentasOfflineUseCase: SincronizarVentasOfflineUseCase,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  async create(@Req() req: any, @Body() dto: CrearVentaDto) {
    const usuarioId = req.user?.userId || req.user?.id || req.user?.sub;
    try {
      return await this.crearVentaUseCase.execute({
        ...dto,
        usuarioId,
      });
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Error al procesar la venta');
    }
  }

  @Post('batch-sync')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CAJERO)
  async batchSync(@Req() req: any, @Body() body: { ventas: VentaOfflineDto[] }) {
    const usuarioId = req.user?.userId || req.user?.id || req.user?.sub;
    try {
      return await this.sincronizarVentasOfflineUseCase.execute(usuarioId, body.ventas || []);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Error al sincronizar las ventas offline');
    }
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
