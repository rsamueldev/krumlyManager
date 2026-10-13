import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LoteProduccionEntity } from '../../../domain/entities/lote-produccion.entity';
import {
  ConsumoCongeladorItem,
  ConsumoInsumoEstimado,
  HornearLoteInput,
  ProduccionRepositoryPort,
  SimularHorneadoResultado,
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

    // 2. Consumo por Insumos Adicionales del Producto — SOLO los de produccion
    // (toppings internos/rellenos que van en la masa antes de congelar)
    // Los de tipo 'despacho' (empaque, decoración final) se descuentan en la venta, no aquí.
    if (producto.insumosAdicionales) {
      for (const itemAdicional of producto.insumosAdicionales) {
        if (itemAdicional.tipoUso !== 'produccion') continue;  // ← ignorar despacho
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

    return await this.prisma.$transaction(
      async (tx) => {
        // 1. Descontar stock de insumos consumidos en paralelo
        if (sim.consumoInsumos.length > 0) {
          await Promise.all(
            sim.consumoInsumos.map((item) =>
              tx.insumo.update({
                where: { id: item.insumoId },
                data: {
                  stockActual: {
                    decrement: item.cantidadRequerida,
                  },
                },
              }),
            ),
          );
        }

        // 2. Incrementar stock del producto en CONGELADOR (amasado y llevado a congelación)
        const productoActualizado = await tx.producto.update({
          where: { id: data.productoId },
          data: {
            stockCongelador: {
              increment: data.cantidadProducida,
            },
          },
        });

        // 3. Registrar entrada en lotes_produccion como 'amasado'
        const lote = await tx.loteProduccion.create({
          data: {
            productoId: data.productoId,
            recetaId: productoActualizado.recetaId || null,
            tipoLote: 'amasado',
            cantidadProducida: data.cantidadProducida,
            fechaProduccion: new Date(),
            notas: data.notas?.trim() || null,
            usuarioId: data.usuarioId,
          },
          include: {
            producto: { select: { id: true, nombre: true, stockActual: true, stockCongelador: true } },
            receta: { select: { id: true, nombre: true } },
            usuario: { select: { id: true, username: true } },
          },
        });

        return this.toEntity(lote);
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );
  }

  async simularHorneado(
    productoId: string,
    cantidad: number,
    galletasSeleccionadas?: Array<{ productoId: string; cantidad: number }>,
  ): Promise<SimularHorneadoResultado> {
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
      include: {
        comboItems: {
          include: { producto: true },
        },
        insumosAdicionales: {
          where: { tipoUso: 'despacho' },
          include: { insumo: true },
        },
      },
    });

    if (!producto) {
      throw new NotFoundException(`El producto con ID ${productoId} no existe.`);
    }

    const esCombo = producto.esCombo;
    const consumoCongelador: ConsumoCongeladorItem[] = [];
    const consumoEmpaque: ConsumoInsumoEstimado[] = [];
    let puedoHornear = true;

    if (esCombo) {
      const itemsDeseados = galletasSeleccionadas && galletasSeleccionadas.length > 0
        ? galletasSeleccionadas
        : producto.comboItems.map((ci) => ({ productoId: ci.productoId, cantidad: ci.cantidad }));

      for (const item of itemsDeseados) {
        const prodHijo = await this.prisma.producto.findUnique({ where: { id: item.productoId } });
        if (!prodHijo) continue;
        const cantRequerida = item.cantidad * cantidad;
        const stockDisp = Number(prodHijo.stockCongelador || 0);
        const faltante = Math.max(0, cantRequerida - stockDisp);
        const suficiente = stockDisp >= cantRequerida;
        if (!suficiente) puedoHornear = false;

        consumoCongelador.push({
          productoId: prodHijo.id,
          nombreProducto: prodHijo.nombre,
          cantidadRequerida: cantRequerida,
          stockDisponible: stockDisp,
          faltante,
          suficiente,
        });
      }
    } else {
      const cantRequerida = cantidad;
      const stockDisp = Number(producto.stockCongelador || 0);
      const faltante = Math.max(0, cantRequerida - stockDisp);
      const suficiente = stockDisp >= cantRequerida;
      if (!suficiente) puedoHornear = false;

      consumoCongelador.push({
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidadRequerida: cantRequerida,
        stockDisponible: stockDisp,
        faltante,
        suficiente,
      });
    }

    for (const itemEmpaque of producto.insumosAdicionales) {
      const insumo = itemEmpaque.insumo;
      const cantRequerida = Number(itemEmpaque.cantidad) * cantidad;
      const stockDisp = Number(insumo.stockActual || 0);
      const faltante = Math.max(0, Number((cantRequerida - stockDisp).toFixed(2)));
      const suficiente = stockDisp >= cantRequerida;
      if (!suficiente) puedoHornear = false;

      consumoEmpaque.push({
        insumoId: insumo.id,
        nombreInsumo: insumo.nombre,
        unidadMedida: insumo.unidadMedida,
        stockActual: stockDisp,
        cantidadRequerida: Number(cantRequerida.toFixed(2)),
        faltante,
        suficiente,
      });
    }

    return {
      productoId: producto.id,
      nombreProducto: producto.nombre,
      cantidadAHornear: cantidad,
      esCombo,
      puedoHornear,
      consumoCongelador,
      consumoEmpaque,
    };
  }

  async hornearLote(data: HornearLoteInput): Promise<LoteProduccionEntity> {
    const sim = await this.simularHorneado(data.productoId, data.cantidad, data.galletasSeleccionadas);

    if (!sim.puedoHornear) {
      const faltantesCongelador = sim.consumoCongelador
        .filter((i) => !i.suficiente)
        .map((i) => `${i.nombreProducto}: requiere ${i.cantidadRequerida}, en congelador: ${i.stockDisponible}`)
        .join('; ');

      const faltantesEmpaque = sim.consumoEmpaque
        .filter((i) => !i.suficiente)
        .map((i) => `${i.nombreInsumo}: requiere ${i.cantidadRequerida} ${i.unidadMedida}, disponible: ${i.stockActual}`)
        .join('; ');

      const detalles = [faltantesCongelador, faltantesEmpaque].filter(Boolean).join(' | ');
      throw new BadRequestException(`No se puede hornear/empacar. Faltantes: ${detalles}`);
    }

    return await this.prisma.$transaction(
      async (tx) => {
        // 1. Descontar del CONGELADOR las galletas crudas utilizadas
        for (const item of sim.consumoCongelador) {
          await tx.producto.update({
            where: { id: item.productoId },
            data: {
              stockCongelador: { decrement: item.cantidadRequerida },
            },
          });
        }

        // 2. Descontar insumos de despacho/empaque (cajas, bolsas)
        for (const empaque of sim.consumoEmpaque) {
          await tx.insumo.update({
            where: { id: empaque.insumoId },
            data: {
              stockActual: { decrement: empaque.cantidadRequerida },
            },
          });
        }

        // 3. Incrementar el stock listo para la venta (vitrina / POS)
        const productoActualizado = await tx.producto.update({
          where: { id: data.productoId },
          data: {
            stockActual: { increment: data.cantidad },
          },
        });

        // 4. Registrar en historial de lotes como 'horneado'
        const lote = await tx.loteProduccion.create({
          data: {
            productoId: data.productoId,
            recetaId: productoActualizado.recetaId || null,
            tipoLote: 'horneado',
            cantidadProducida: data.cantidad,
            fechaProduccion: new Date(),
            notas: data.notas?.trim() || (sim.esCombo ? 'Armado y empaque de cajas para venta' : 'Horneado y empaque para venta'),
            usuarioId: data.usuarioId,
          },
          include: {
            producto: { select: { id: true, nombre: true, stockActual: true, stockCongelador: true } },
            receta: { select: { id: true, nombre: true } },
            usuario: { select: { id: true, username: true } },
          },
        });

        return this.toEntity(lote);
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );
  }

  async obtenerHistorialLotes(limit: number = 50): Promise<LoteProduccionEntity[]> {
    const list = await this.prisma.loteProduccion.findMany({
      take: limit,
      orderBy: { fechaProduccion: 'desc' },
      include: {
        producto: { select: { id: true, nombre: true, stockActual: true, stockCongelador: true } },
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
      db.producto ? { id: db.producto.id, nombre: db.producto.nombre, stockActual: db.producto.stockActual, stockCongelador: db.producto.stockCongelador } : undefined,
      db.receta ? { id: db.receta.id, nombre: db.receta.nombre } : undefined,
      db.usuario ? { id: db.usuario.id, username: db.usuario.username } : undefined,
      db.tipoLote || 'amasado',
      db.createdAt,
    );
  }
}
