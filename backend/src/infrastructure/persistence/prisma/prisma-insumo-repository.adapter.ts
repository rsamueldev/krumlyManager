import { Injectable } from '@nestjs/common';
import { InsumoEntity, UnidadMedidaEnum } from '../../../domain/entities/insumo.entity';
import { InsumoRepositoryPort } from '../../../domain/ports/insumo-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaInsumoRepositoryAdapter implements InsumoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<InsumoEntity[]> {
    const items = await this.prisma.insumo.findMany({
      orderBy: { nombre: 'asc' },
    });
    return items.map((item) => this.toEntity(item));
  }

  async findById(id: string): Promise<InsumoEntity | null> {
    const item = await this.prisma.insumo.findUnique({
      where: { id },
    });
    if (!item) return null;
    return this.toEntity(item);
  }

  async create(insumo: Omit<InsumoEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<InsumoEntity> {
    const created = await this.prisma.insumo.create({
      data: {
        nombre: insumo.nombre,
        unidadMedida: insumo.unidadMedida as any,
        cantidadEmpaque: insumo.cantidadEmpaque,
        precioCompra: insumo.precioCompra,
        costoUnitario: insumo.costoUnitario,
        stockActual: insumo.stockActual,
        stockMinimo: insumo.stockMinimo,
      },
    });
    return this.toEntity(created);
  }

  async update(id: string, insumo: Partial<InsumoEntity>): Promise<InsumoEntity> {
    const updated = await this.prisma.insumo.update({
      where: { id },
      data: {
        ...(insumo.nombre && { nombre: insumo.nombre }),
        ...(insumo.unidadMedida && { unidadMedida: insumo.unidadMedida as any }),
        ...(insumo.cantidadEmpaque !== undefined && { cantidadEmpaque: insumo.cantidadEmpaque }),
        ...(insumo.precioCompra !== undefined && { precioCompra: insumo.precioCompra }),
        ...(insumo.costoUnitario !== undefined && { costoUnitario: insumo.costoUnitario }),
        ...(insumo.stockActual !== undefined && { stockActual: insumo.stockActual }),
        ...(insumo.stockMinimo !== undefined && { stockMinimo: insumo.stockMinimo }),
      },
    });
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.insumo.delete({
      where: { id },
    });
    return true;
  }

  private toEntity(prismaInsumo: any): InsumoEntity {
    return new InsumoEntity(
      prismaInsumo.id,
      prismaInsumo.nombre,
      prismaInsumo.unidadMedida as UnidadMedidaEnum,
      Number(prismaInsumo.cantidadEmpaque),
      Number(prismaInsumo.precioCompra),
      Number(prismaInsumo.costoUnitario),
      Number(prismaInsumo.stockActual),
      Number(prismaInsumo.stockMinimo),
      prismaInsumo.createdAt,
      prismaInsumo.updatedAt,
    );
  }
}
