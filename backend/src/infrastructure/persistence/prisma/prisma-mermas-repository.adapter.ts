import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MermaEntity } from '../../../domain/entities/merma.entity';
import {
  MermasRepositoryPort,
  RegistrarMermaData,
} from '../../../domain/ports/mermas-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaMermasRepositoryAdapter implements MermasRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async registrarMerma(data: RegistrarMermaData): Promise<MermaEntity> {
    const producto = await this.prisma.producto.findUnique({
      where: { id: data.productoId },
    });

    if (!producto) {
      throw new NotFoundException(`El producto con ID ${data.productoId} no existe.`);
    }

    if (producto.stockActual < data.cantidad) {
      throw new BadRequestException(
        `No es posible descartar ${data.cantidad} unidades. Stock disponible actual: ${producto.stockActual} unidades.`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Decrementar stock del producto
      await tx.producto.update({
        where: { id: data.productoId },
        data: {
          stockActual: {
            decrement: data.cantidad,
          },
        },
      });

      // 2. Crear registro de merma
      const merma = await tx.merma.create({
        data: {
          productoId: data.productoId,
          cantidad: data.cantidad,
          motivo: data.motivo.trim(),
          usuarioId: data.usuarioId,
          fechaMerma: new Date(),
        },
        include: {
          producto: {
            select: { id: true, nombre: true, costoDirectoTotal: true, stockActual: true },
          },
          usuario: {
            select: { id: true, username: true },
          },
        },
      });

      return this.toEntity(merma);
    });
  }

  async obtenerHistorialMermas(limit: number = 50): Promise<MermaEntity[]> {
    const list = await this.prisma.merma.findMany({
      take: limit,
      orderBy: { fechaMerma: 'desc' },
      include: {
        producto: {
          select: { id: true, nombre: true, costoDirectoTotal: true, stockActual: true },
        },
        usuario: {
          select: { id: true, username: true },
        },
      },
    });

    return list.map((item) => this.toEntity(item));
  }

  private toEntity(db: any): MermaEntity {
    return new MermaEntity(
      db.id,
      db.productoId,
      db.cantidad,
      db.motivo,
      db.fechaMerma,
      db.usuarioId,
      db.producto
        ? {
            id: db.producto.id,
            nombre: db.producto.nombre,
            costoDirectoTotal: Number(db.producto.costoDirectoTotal) || 0,
            stockActual: db.producto.stockActual,
          }
        : undefined,
      db.usuario
        ? {
            id: db.usuario.id,
            username: db.usuario.username,
          }
        : undefined,
      db.createdAt,
    );
  }
}
