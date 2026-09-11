import { Injectable } from '@nestjs/common';
import { RecetaEntity, RecetaInsumoEntity } from '../../../domain/entities/receta.entity';
import { InsumoEntity, UnidadMedidaEnum } from '../../../domain/entities/insumo.entity';
import {
  ActualizarRecetaData,
  CrearRecetaData,
  RecetaRepositoryPort,
} from '../../../domain/ports/receta-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaRecetaRepositoryAdapter implements RecetaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(raw: any): RecetaEntity {
    const insumosMapped = (raw.insumos || []).map((ri: any) => {
      const insumoEntity = ri.insumo
        ? new InsumoEntity(
            ri.insumo.id,
            ri.insumo.nombre,
            ri.insumo.unidadMedida as UnidadMedidaEnum,
            Number(ri.insumo.cantidadEmpaque),
            Number(ri.insumo.precioCompra),
            Number(ri.insumo.costoUnitario),
            ri.insumo.stockActual,
            ri.insumo.stockMinimo,
            ri.insumo.createdAt,
            ri.insumo.updatedAt,
          )
        : undefined;

      const costoCalculado = insumoEntity
        ? Number((Number(ri.cantidad) * insumoEntity.costoUnitario).toFixed(2))
        : 0;

      return new RecetaInsumoEntity(
        ri.id,
        ri.recetaId,
        ri.insumoId,
        Number(ri.cantidad),
        costoCalculado,
        insumoEntity,
      );
    });

    return new RecetaEntity(
      raw.id,
      raw.nombre,
      Number(raw.pesoTotalMezclaGramos),
      Number(raw.costoTotalLote),
      Number(raw.costoPorGramo),
      raw.usuarioId,
      insumosMapped,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  async findAll(): Promise<RecetaEntity[]> {
    const recetas = await this.prisma.receta.findMany({
      include: {
        insumos: {
          include: {
            insumo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return recetas.map((r) => this.mapToDomain(r));
  }

  async findById(id: string): Promise<RecetaEntity | null> {
    const receta = await this.prisma.receta.findUnique({
      where: { id },
      include: {
        insumos: {
          include: {
            insumo: true,
          },
        },
      },
    });
    return receta ? this.mapToDomain(receta) : null;
  }

  async create(data: CrearRecetaData): Promise<RecetaEntity> {
    const creada = await this.prisma.receta.create({
      data: {
        nombre: data.nombre,
        pesoTotalMezclaGramos: data.pesoTotalMezclaGramos,
        costoTotalLote: data.costoTotalLote,
        costoPorGramo: data.costoPorGramo,
        usuarioId: data.usuarioId,
        insumos: {
          create: data.insumos.map((i) => ({
            insumoId: i.insumoId,
            cantidad: i.cantidad,
          })),
        },
      },
      include: {
        insumos: {
          include: {
            insumo: true,
          },
        },
      },
    });
    return this.mapToDomain(creada);
  }

  async update(id: string, data: ActualizarRecetaData): Promise<RecetaEntity> {
    // Si vienen nuevos insumos, eliminamos los anteriores y creamos los nuevos
    if (data.insumos) {
      await this.prisma.recetaInsumo.deleteMany({
        where: { recetaId: id },
      });
    }

    const actualizada = await this.prisma.receta.update({
      where: { id },
      data: {
        nombre: data.nombre,
        pesoTotalMezclaGramos: data.pesoTotalMezclaGramos,
        costoTotalLote: data.costoTotalLote,
        costoPorGramo: data.costoPorGramo,
        insumos: data.insumos
          ? {
              create: data.insumos.map((i) => ({
                insumoId: i.insumoId,
                cantidad: i.cantidad,
              })),
            }
          : undefined,
      },
      include: {
        insumos: {
          include: {
            insumo: true,
          },
        },
      },
    });

    return this.mapToDomain(actualizada);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.receta.delete({
      where: { id },
    });
    return true;
  }
}
