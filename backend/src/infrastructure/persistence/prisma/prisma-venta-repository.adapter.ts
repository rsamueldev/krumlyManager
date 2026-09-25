import { Injectable } from '@nestjs/common';
import { Venta } from '../../../domain/entities/venta.entity';
import { VentaRepositoryPort } from '../../../domain/ports/venta-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaVentaRepositoryAdapter implements VentaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async crearVenta(ventaData: Partial<Venta>, detalles: any[], pagos: any[]): Promise<Venta> {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
    const codigoVenta = `VNT-${randomSuffix}`;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Descontar stockActual de cada producto en la base de datos
      for (const item of detalles) {
        const prod = await tx.producto.findUnique({
          where: { id: item.productoId },
        });
        if (!prod) {
          throw new Error(`El producto especificado (${item.productoId}) no existe.`);
        }
        if (prod.stockActual < item.cantidad) {
          throw new Error(
            `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stockActual}, solicitado: ${item.cantidad}`,
          );
        }

        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stockActual: {
              decrement: item.cantidad,
            },
          },
        });
      }

      // 2. Crear registro de Venta con detalles y pagos anidados
      const nuevaVenta = await tx.venta.create({
        data: {
          codigoVenta,
          fechaVenta: new Date(),
          clienteId: ventaData.clienteId || null,
          totalVenta: ventaData.totalVenta || 0,
          estadoSincronizacion: (ventaData.estadoSincronizacion as any) || 'online',
          usuarioId: ventaData.usuarioId!,
          detalles: {
            create: detalles.map((d) => ({
              productoId: d.productoId,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              subtotal: d.cantidad * d.precioUnitario,
            })),
          },
          pagos: {
            create: pagos.map((p) => ({
              metodoPago: p.metodoPago,
              montoUsd: p.montoUsd,
              montoVes: p.montoVes || null,
              tasaCambio: p.tasaCambio || null,
              referenciaPago: p.referenciaPago || null,
            })),
          },
        },
        include: {
          detalles: {
            include: {
              producto: {
                select: { id: true, nombre: true, precioVenta: true },
              },
            },
          },
          pagos: true,
          cliente: {
            select: { id: true, nombre: true },
          },
          usuario: {
            select: { id: true, username: true },
          },
        },
      });

      return this.mapToDomain(nuevaVenta);
    });
  }

  async obtenerTodas(): Promise<Venta[]> {
    const list = await this.prisma.venta.findMany({
      orderBy: { fechaVenta: 'desc' },
      include: {
        detalles: {
          include: {
            producto: {
              select: { id: true, nombre: true, precioVenta: true },
            },
          },
        },
        pagos: true,
        cliente: {
          select: { id: true, nombre: true },
        },
        usuario: {
          select: { id: true, username: true },
        },
      },
    });

    return list.map((v) => this.mapToDomain(v));
  }

  async obtenerPorId(id: string): Promise<Venta | null> {
    const record = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            producto: {
              select: { id: true, nombre: true, precioVenta: true },
            },
          },
        },
        pagos: true,
        cliente: {
          select: { id: true, nombre: true },
        },
        usuario: {
          select: { id: true, username: true },
        },
      },
    });

    if (!record) return null;
    return this.mapToDomain(record);
  }

  private mapToDomain(db: any): Venta {
    return {
      id: db.id,
      codigoVenta: db.codigoVenta,
      fechaVenta: db.fechaVenta,
      clienteId: db.clienteId,
      totalVenta: Number(db.totalVenta),
      estadoSincronizacion: db.estadoSincronizacion,
      usuarioId: db.usuarioId,
      cliente: db.cliente ? { id: db.cliente.id, nombre: db.cliente.nombre } : null,
      usuario: db.usuario ? { id: db.usuario.id, username: db.usuario.username } : undefined,
      detalles: (db.detalles || []).map((d: any) => ({
        id: d.id,
        ventaId: d.ventaId,
        productoId: d.productoId,
        cantidad: d.cantidad,
        precioUnitario: Number(d.precioUnitario),
        subtotal: Number(d.subtotal),
        producto: d.producto
          ? { id: d.producto.id, nombre: d.producto.nombre, precioVenta: Number(d.producto.precioVenta) }
          : undefined,
      })),
      pagos: (db.pagos || []).map((p: any) => ({
        id: p.id,
        ventaId: p.ventaId,
        metodoPago: p.metodoPago,
        montoUsd: Number(p.montoUsd),
        montoVes: p.montoVes ? Number(p.montoVes) : undefined,
        tasaCambio: p.tasaCambio ? Number(p.tasaCambio) : undefined,
        referenciaPago: p.referenciaPago || undefined,
      })),
      createdAt: db.createdAt,
    };
  }
}
