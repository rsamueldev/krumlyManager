import { Injectable } from '@nestjs/common';
import { CategoriaEntity, TipoCategoriaEnum } from '../../../domain/entities/categoria.entity';
import { CategoriaRepositoryPort } from '../../../domain/ports/categoria-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaCategoriaRepositoryAdapter implements CategoriaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tipo?: TipoCategoriaEnum): Promise<CategoriaEntity[]> {
    const items = await this.prisma.categoria.findMany({
      where: {
        ...(tipo && { tipo: tipo as any }),
      },
      orderBy: { nombre: 'asc' },
    });
    return items.map((item) => this.toEntity(item));
  }

  async findById(id: string): Promise<CategoriaEntity | null> {
    const item = await this.prisma.categoria.findUnique({
      where: { id },
    });
    if (!item) return null;
    return this.toEntity(item);
  }

  async create(categoria: Omit<CategoriaEntity, 'id' | 'createdAt'>): Promise<CategoriaEntity> {
    const created = await this.prisma.categoria.create({
      data: {
        nombre: categoria.nombre,
        tipo: categoria.tipo as any,
      },
    });
    return this.toEntity(created);
  }

  async update(id: string, categoria: Partial<CategoriaEntity>): Promise<CategoriaEntity> {
    const updated = await this.prisma.categoria.update({
      where: { id },
      data: {
        ...(categoria.nombre && { nombre: categoria.nombre }),
        ...(categoria.tipo && { tipo: categoria.tipo as any }),
      },
    });
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.categoria.delete({
      where: { id },
    });
    return true;
  }

  private toEntity(prismaCategoria: any): CategoriaEntity {
    return new CategoriaEntity(
      prismaCategoria.id,
      prismaCategoria.nombre,
      prismaCategoria.tipo as TipoCategoriaEnum,
      prismaCategoria.createdAt,
    );
  }
}
