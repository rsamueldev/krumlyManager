import { Injectable } from '@nestjs/common';
import { ProductoEntity, ProductoInsumoAdicionalEntity } from '../../../domain/entities/producto.entity';
import { CategoriaEntity } from '../../../domain/entities/categoria.entity';
import { RecetaEntity } from '../../../domain/entities/receta.entity';
import { InsumoEntity, UnidadMedidaEnum } from '../../../domain/entities/insumo.entity';
import {
  ActualizarProductoData,
  CrearProductoData,
  ProductoRepositoryPort,
} from '../../../domain/ports/producto-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaProductoRepositoryAdapter implements ProductoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(raw: any): ProductoEntity {
    const categoriaEntity = raw.categoria
      ? new CategoriaEntity(raw.categoria.id, raw.categoria.nombre, raw.categoria.tipo, raw.categoria.createdAt)
      : undefined;

    const recetaEntity = raw.receta
      ? new RecetaEntity(
          raw.receta.id,
          raw.receta.nombre,
          Number(raw.receta.pesoTotalMezclaGramos),
          Number(raw.receta.costoTotalLote),
          Number(raw.receta.costoPorGramo),
          raw.receta.usuarioId,
          [],
          raw.receta.createdAt,
          raw.receta.updatedAt,
        )
      : undefined;

    const insumosAdicionalesMapped = (raw.insumosAdicionales || []).map((pia: any) => {
      const insumoEntity = pia.insumo
        ? new InsumoEntity(
            pia.insumo.id,
            pia.insumo.nombre,
            pia.insumo.unidadMedida as UnidadMedidaEnum,
            Number(pia.insumo.cantidadEmpaque),
            Number(pia.insumo.precioCompra),
            Number(pia.insumo.costoUnitario),
            pia.insumo.stockActual,
            pia.insumo.stockMinimo,
            pia.insumo.createdAt,
            pia.insumo.updatedAt,
          )
        : undefined;

      const costoCalculado = insumoEntity
        ? Number((Number(pia.cantidad) * insumoEntity.costoUnitario).toFixed(2))
        : 0;

      return new ProductoInsumoAdicionalEntity(
        pia.id,
        pia.productoId,
        pia.insumoId,
        Number(pia.cantidad),
        costoCalculado,
        insumoEntity,
      );
    });

    return new ProductoEntity(
      raw.id,
      raw.nombre,
      raw.categoriaId,
      raw.recetaId,
      Number(raw.pesoMasaGramos || 0),
      Number(raw.costoMasaUnidad || 0),
      Number(raw.costoInsumosAdicionales || 0),
      Number(raw.costoEmpaque || 0),
      Number(raw.costoManoObra || 0),
      Number(raw.costoDepreciacion || 0),
      Number(raw.porcentajeDesperdicio || 5),
      Number(raw.costoDirectoTotal || 0),
      Number(raw.precioVenta || 0),
      Number(raw.margenGananciaPorcentaje || 0),
      Number(raw.stockActual || 0),
      Number(raw.stockMinimo || 10),
      Boolean(raw.activo),
      categoriaEntity,
      recetaEntity,
      insumosAdicionalesMapped,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  async findAll(): Promise<ProductoEntity[]> {
    const items = await this.prisma.producto.findMany({
      include: {
        categoria: true,
        receta: true,
        insumosAdicionales: {
          include: {
            insumo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((p) => this.mapToDomain(p));
  }

  async findById(id: string): Promise<ProductoEntity | null> {
    const item = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        receta: true,
        insumosAdicionales: {
          include: {
            insumo: true,
          },
        },
      },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async create(data: CrearProductoData): Promise<ProductoEntity> {
    const created = await this.prisma.producto.create({
      data: {
        nombre: data.nombre,
        categoriaId: data.categoriaId,
        recetaId: data.recetaId,
        pesoMasaGramos: data.pesoMasaGramos,
        costoMasaUnidad: data.costoMasaUnidad,
        costoInsumosAdicionales: data.costoInsumosAdicionales,
        costoEmpaque: data.costoEmpaque,
        costoManoObra: data.costoManoObra,
        costoDepreciacion: data.costoDepreciacion,
        porcentajeDesperdicio: data.porcentajeDesperdicio,
        costoDirectoTotal: data.costoDirectoTotal,
        precioVenta: data.precioVenta,
        margenGananciaPorcentaje: data.margenGananciaPorcentaje,
        stockActual: data.stockActual,
        stockMinimo: data.stockMinimo,
        insumosAdicionales: data.insumosAdicionales
          ? {
              create: data.insumosAdicionales.map((i) => ({
                insumoId: i.insumoId,
                cantidad: i.cantidad,
              })),
            }
          : undefined,
      },
      include: {
        categoria: true,
        receta: true,
        insumosAdicionales: {
          include: {
            insumo: true,
          },
        },
      },
    });
    return this.mapToDomain(created);
  }

  async update(id: string, data: ActualizarProductoData): Promise<ProductoEntity> {
    if (data.insumosAdicionales) {
      await this.prisma.productoInsumoAdicional.deleteMany({
        where: { productoId: id },
      });
    }

    const updated = await this.prisma.producto.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.categoriaId !== undefined && { categoriaId: data.categoriaId }),
        ...(data.recetaId !== undefined && { recetaId: data.recetaId }),
        ...(data.pesoMasaGramos !== undefined && { pesoMasaGramos: data.pesoMasaGramos }),
        ...(data.costoMasaUnidad !== undefined && { costoMasaUnidad: data.costoMasaUnidad }),
        ...(data.costoInsumosAdicionales !== undefined && { costoInsumosAdicionales: data.costoInsumosAdicionales }),
        ...(data.costoEmpaque !== undefined && { costoEmpaque: data.costoEmpaque }),
        ...(data.costoManoObra !== undefined && { costoManoObra: data.costoManoObra }),
        ...(data.costoDepreciacion !== undefined && { costoDepreciacion: data.costoDepreciacion }),
        ...(data.porcentajeDesperdicio !== undefined && { porcentajeDesperdicio: data.porcentajeDesperdicio }),
        ...(data.costoDirectoTotal !== undefined && { costoDirectoTotal: data.costoDirectoTotal }),
        ...(data.precioVenta !== undefined && { precioVenta: data.precioVenta }),
        ...(data.margenGananciaPorcentaje !== undefined && { margenGananciaPorcentaje: data.margenGananciaPorcentaje }),
        ...(data.stockActual !== undefined && { stockActual: data.stockActual }),
        ...(data.stockMinimo !== undefined && { stockMinimo: data.stockMinimo }),
        ...(data.activo !== undefined && { activo: data.activo }),
        insumosAdicionales: data.insumosAdicionales
          ? {
              create: data.insumosAdicionales.map((i) => ({
                insumoId: i.insumoId,
                cantidad: i.cantidad,
              })),
            }
          : undefined,
      },
      include: {
        categoria: true,
        receta: true,
        insumosAdicionales: {
          include: {
            insumo: true,
          },
        },
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.producto.delete({
      where: { id },
    });
    return true;
  }
}
