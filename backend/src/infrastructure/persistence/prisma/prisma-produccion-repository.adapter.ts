import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LoteProduccionEntity } from '../../../domain/entities/lote-produccion.entity';
import {
  ConsumoInsumoEstimado,
  ProduccionRepositoryPort,
  SimularProduccionResultado,
} from '../../../domain/ports/produccion-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaProduccionRepositoryAdapter implements ProduccionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async simularProduccion(productoId: string, cantidadAProducir: number): Promise<SimularProduccionResultado> {
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
      include: {
        receta: {
          include: {
            insumos: {
              include: {
                insumo: true,
              },
            },
          },
        },
        insumosAdicionales: {
          include: {
            insumo: true,
          },
        },
      },
    });

    if (!producto) {
      throw new NotFoundException(`El producto con ID ${productoId} no existe.`);
    }

    const mapaConsumo = new Map<string, { insumo: any; cantidadRequerida: number }>();

    // 1. Consumo por Receta Base
    if (producto.receta && producto.receta.insumos) {
      const pesoMasaGalleta = Number(producto.pesoMasaGramos) || 0;
      const pesoTotalMezcla = Number(producto.receta.pesoTotalMezclaGramos) || 1;

      // Masa Total = Cantidad Galletas * Gramos de masa por unidad
      const masaTotalRequerida = cantidadAProducir * pesoMasaGalleta;
      const multiplicadorReceta = masaTotalRequerida / (pesoTotalMezcla > 0 ? pesoTotalMezcla : 1);

      for (const itemReceta of producto.receta.insumos) {
        const insumo = itemReceta.insumo;
        const cantInsumoReceta = Number(itemReceta.cantidad) || 0;
        const requereInsumo = cantInsumoReceta * multiplicadorReceta;

        if (mapaConsumo.has(insumo.id)) {
          mapaConsumo.get(insumo.id)!.cantidadRequerida += requereInsumo;
        } else {
          mapaConsumo.set(insumo.id, { insumo, cantidadRequerida: requereInsumo });
        }
      }
    }

    // 2. Consumo por Insumos Adicionales del Producto (ej. empaque, capacillos por unidad)
    if (producto.insumosAdicionales) {
      for (const itemAdicional of producto.insumosAdicionales) {
        const insumo = itemAdicional.insumo;
        const cantPorUnidad = Number(itemAdicional.cantidad) || 0;
        const requereInsumo = cantPorUnidad * cantidadAProducir;

        if (mapaConsumo.has(insumo.id)) {
          mapaConsumo.get(insumo.id)!.cantidadRequerida += requereInsumo;
        } else {
          mapaConsumo.set(insumo.id, { insumo, cantidadRequerida: requereInsumo });
        }
      }
    }

    const consumoInsumos: ConsumoInsumoEstimado[] = [];
    let puedoProducir = true;

    for (const [insumoId, data] of mapaConsumo.entries()) {
      const stockActual = Number(data.insumo.stockActual) || 0;
      const cantidadRequerida = Number(data.cantidadRequerida.toFixed(2));
      const faltante = Math.max(0, Number((cantidadRequerida - stockActual).toFixed(2)));
      const suficiente = stockActual >= cantidadRequerida;

      if (!suficiente) {
        puedoProducir = false;
      }

      consumoInsumos.push({
        insumoId,
        nombreInsumo: data.insumo.nombre,
        unidadMedida: data.insumo.unidadMedida,
        stockActual,
        cantidadRequerida,
        faltante,
        suficiente,
      });
    }

    return {
      productoId: producto.id,
      nombreProducto: producto.nombre,
      cantidadAProducir,
      puedoProducir,
      consumoInsumos,
    };
  }

  async registrarLote(data: {
    productoId: string;
    cantidadProducida: number;
    usuarioId: string;
    notas?: string;
  }): Promise<LoteProduccionEntity> {
    const sim = await this.simularProduccion(data.productoId, data.cantidadProducida);

    if (!sim.puedoProducir) {
      const faltantes = sim.consumoInsumos
        .filter((i) => !i.suficiente)
        .map((i) => `${i.nombreInsumo}: requiere ${i.cantidadRequerida} ${i.unidadMedida}, disponible: ${i.stockActual} ${i.unidadMedida} (faltan ${i.faltante} ${i.unidadMedida})`)
        .join('; ');

      throw new BadRequestException(`No hay suficiente materia prima para este horneado. Faltantes: ${faltantes}`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Descontar stock de insumos consumidos
      for (const item of sim.consumoInsumos) {
        await tx.insumo.update({
          where: { id: item.insumoId },
          data: {
            stockActual: {
              decrement: item.cantidadRequerida,
            },
          },
        });
      }

      // 2. Incrementar stock del producto galleta terminado
      const productoActualizado = await tx.producto.update({
        where: { id: data.productoId },
        data: {
          stockActual: {
            increment: data.cantidadProducida,
          },
        },
      });

      // 3. Registrar entrada en lotes_produccion
      const lote = await tx.loteProduccion.create({
        data: {
          productoId: data.productoId,
          recetaId: productoActualizado.recetaId || null,
          cantidadProducida: data.cantidadProducida,
          fechaProduccion: new Date(),
          notas: data.notas?.trim() || null,
          usuarioId: data.usuarioId,
        },
        include: {
          producto: { select: { id: true, nombre: true, stockActual: true } },
          receta: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, username: true } },
        },
      });

      return this.toEntity(lote);
    });
  }

  async obtenerHistorialLotes(limit: number = 50): Promise<LoteProduccionEntity[]> {
    const list = await this.prisma.loteProduccion.findMany({
      take: limit,
      orderBy: { fechaProduccion: 'desc' },
      include: {
        producto: { select: { id: true, nombre: true, stockActual: true } },
        receta: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, username: true } },
      },
    });

    return list.map((item) => this.toEntity(item));
  }

  private toEntity(db: any): LoteProduccionEntity {
    return new LoteProduccionEntity(
      db.id,
      db.productoId,
      db.recetaId,
      db.cantidadProducida,
      db.fechaProduccion,
      db.notas,
      db.usuarioId,
      db.producto ? { id: db.producto.id, nombre: db.producto.nombre, stockActual: db.producto.stockActual } : undefined,
      db.receta ? { id: db.receta.id, nombre: db.receta.nombre } : undefined,
      db.usuario ? { id: db.usuario.id, username: db.usuario.username } : undefined,
      db.createdAt,
    );
  }
}
