import { Injectable, NotFoundException } from '@nestjs/common';
import { GastoEntity } from '../../../domain/entities/gasto.entity';
import {
  GastosRepositoryPort,
  RegistrarGastoData,
} from '../../../domain/ports/gastos-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaGastosRepositoryAdapter implements GastosRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async registrarGasto(data: RegistrarGastoData): Promise<GastoEntity> {
    const gasto = await this.prisma.gasto.create({
      data: {
        tipoGasto: data.tipoGasto,
        concepto: data.concepto.trim(),
        montoUsd: data.montoUsd,
        montoVes: data.montoVes || null,
        tasaCambio: data.tasaCambio || null,
        metodoPago: data.metodoPago || null,
        fechaGasto: data.fechaGasto || new Date(),
        categoriaId: data.categoriaId || null,
        usuarioId: data.usuarioId,
      },
      include: {
        categoria: {
          select: { id: true, nombre: true, tipo: true },
        },
        usuario: {
          select: { id: true, username: true },
        },
      },
    });

    return this.toEntity(gasto);
  }

  async obtenerGastos(limit: number = 100): Promise<GastoEntity[]> {
    const list = await this.prisma.gasto.findMany({
      take: limit,
      orderBy: { fechaGasto: 'desc' },
      include: {
        categoria: {
          select: { id: true, nombre: true, tipo: true },
        },
        usuario: {
          select: { id: true, username: true },
        },
      },
    });

    return list.map((item) => this.toEntity(item));
  }

  async eliminarGasto(id: string): Promise<boolean> {
    const existing = await this.prisma.gasto.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`El gasto con ID ${id} no fue encontrado.`);
    }

    await this.prisma.gasto.delete({ where: { id } });
    return true;
  }

  private toEntity(db: any): GastoEntity {
    return new GastoEntity(
      db.id,
      db.tipoGasto as any,
      db.concepto,
      Number(db.montoUsd) || 0,
      db.montoVes ? Number(db.montoVes) : null,
      db.tasaCambio ? Number(db.tasaCambio) : null,
      db.metodoPago,
      db.fechaGasto,
      db.categoriaId,
      db.usuarioId,
      db.categoria
        ? {
            id: db.categoria.id,
            nombre: db.categoria.nombre,
            tipo: db.categoria.tipo,
          }
        : null,
      db.usuario
        ? {
            id: db.usuario.id,
            username: db.usuario.username,
          }
        : null,
      db.createdAt,
    );
  }
}
