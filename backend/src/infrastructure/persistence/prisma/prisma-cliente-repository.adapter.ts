import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteEntity } from '../../../domain/entities/cliente.entity';
import { ClienteRepositoryPort } from '../../../domain/ports/cliente-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaClienteRepositoryAdapter implements ClienteRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async crear(cliente: {
    nombre: string;
    cedulaRif?: string | null;
    telefono?: string | null;
    ubicacion?: string | null;
    activo?: boolean;
  }): Promise<ClienteEntity> {
    const cedulaRifNormalizada = cliente.cedulaRif?.trim().toUpperCase() || null;

    if (cedulaRifNormalizada) {
      const existe = await this.prisma.cliente.findUnique({
        where: { cedulaRif: cedulaRifNormalizada },
      });
      if (existe) {
        throw new BadRequestException(`Ya existe un cliente con la Cédula/RIF "${cedulaRifNormalizada}".`);
      }
    }

    const created = await this.prisma.cliente.create({
      data: {
        nombre: cliente.nombre.trim(),
        cedulaRif: cedulaRifNormalizada,
        telefono: cliente.telefono?.trim() || null,
        ubicacion: cliente.ubicacion?.trim() || null,
        activo: cliente.activo ?? true,
      },
      include: {
        _count: {
          select: { ventas: true },
        },
      },
    });

    return this.toEntity(created);
  }

  async obtenerTodos(filtro?: { busqueda?: string; activo?: boolean }): Promise<ClienteEntity[]> {
    const whereClause: any = {};

    if (typeof filtro?.activo === 'boolean') {
      whereClause.activo = filtro.activo;
    }

    if (filtro?.busqueda && filtro.busqueda.trim() !== '') {
      const term = filtro.busqueda.trim();
      whereClause.OR = [
        { cedulaRif: { contains: term, mode: 'insensitive' } },
        { nombre: { contains: term, mode: 'insensitive' } },
        { telefono: { contains: term, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.cliente.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { ventas: true },
        },
      },
    });

    return items.map((item) => this.toEntity(item));
  }

  async obtenerPorId(id: string): Promise<ClienteEntity | null> {
    const item = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        _count: {
          select: { ventas: true },
        },
      },
    });

    if (!item) return null;
    return this.toEntity(item);
  }

  async obtenerPorCedulaRif(cedulaRif: string): Promise<ClienteEntity | null> {
    const term = cedulaRif.trim().toUpperCase();
    const item = await this.prisma.cliente.findUnique({
      where: { cedulaRif: term },
      include: {
        _count: {
          select: { ventas: true },
        },
      },
    });

    if (!item) return null;
    return this.toEntity(item);
  }

  async actualizar(
    id: string,
    cliente: {
      nombre?: string;
      cedulaRif?: string | null;
      telefono?: string | null;
      ubicacion?: string | null;
      activo?: boolean;
    },
  ): Promise<ClienteEntity> {
    const existe = await this.prisma.cliente.findUnique({ where: { id } });
    if (!existe) {
      throw new NotFoundException(`El cliente con ID ${id} no existe.`);
    }

    const cedulaRifNormalizada = cliente.cedulaRif !== undefined
      ? (cliente.cedulaRif?.trim().toUpperCase() || null)
      : undefined;

    if (cedulaRifNormalizada && cedulaRifNormalizada !== existe.cedulaRif) {
      const duplicado = await this.prisma.cliente.findUnique({
        where: { cedulaRif: cedulaRifNormalizada },
      });
      if (duplicado && duplicado.id !== id) {
        throw new BadRequestException(`Ya existe otro cliente con la Cédula/RIF "${cedulaRifNormalizada}".`);
      }
    }

    const updated = await this.prisma.cliente.update({
      where: { id },
      data: {
        ...(cliente.nombre !== undefined && { nombre: cliente.nombre.trim() }),
        ...(cliente.cedulaRif !== undefined && { cedulaRif: cedulaRifNormalizada }),
        ...(cliente.telefono !== undefined && { telefono: cliente.telefono?.trim() || null }),
        ...(cliente.ubicacion !== undefined && { ubicacion: cliente.ubicacion?.trim() || null }),
        ...(cliente.activo !== undefined && { activo: cliente.activo }),
      },
      include: {
        _count: {
          select: { ventas: true },
        },
      },
    });

    return this.toEntity(updated);
  }

  async toggleActivo(id: string, activo?: boolean): Promise<ClienteEntity> {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(`El cliente con ID ${id} no existe.`);
    }

    const nuevoEstado = typeof activo === 'boolean' ? activo : !cliente.activo;

    const updated = await this.prisma.cliente.update({
      where: { id },
      data: { activo: nuevoEstado },
      include: {
        _count: {
          select: { ventas: true },
        },
      },
    });

    return this.toEntity(updated);
  }

  private toEntity(db: any): ClienteEntity {
    return new ClienteEntity(
      db.id,
      db.nombre,
      db.cedulaRif,
      db.telefono,
      db.ubicacion,
      db.activo,
      db._count?.ventas ?? 0,
      db.createdAt,
      db.updatedAt,
    );
  }
}
