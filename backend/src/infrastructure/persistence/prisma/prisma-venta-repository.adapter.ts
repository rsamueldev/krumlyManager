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

    const normalizarMetodo = (m?: string): any => {
      if (!m) return 'efectivo_usd';
      if (m === 'punto') return 'punto_venta';
      const valid = ['efectivo_usd', 'efectivo_ves', 'pago_movil', 'punto_venta', 'transferencia'];
      return valid.includes(m) ? m : 'efectivo_usd';
    };

    return await this.prisma.$transaction(async (tx) => {
      // 1. Descontar stockActual de cada producto en la base de datos
      for (const item of detalles) {
        const cant = Math.max(1, Number(item.cantidad) || 1);
        const prod = await tx.producto.findUnique({
          where: { id: item.productoId },
          include: {
            insumosAdicionales: {
              where: { tipoUso: 'despacho' },
              include: { insumo: true },
            },
          },
        });
        if (!prod) {
          throw new Error(`El producto especificado (${item.productoId}) no existe.`);
        }
        if (prod.stockActual < cant) {
          throw new Error(
            `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stockActual}, solicitado: ${cant}`,
          );
        }

        // Descontar stock del producto terminado (galleta congelada)
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stockActual: { decrement: cant } },
        });

        // Descontar stock de insumos de despacho (empaque + decoración final)
        // Cada galleta vendida consume la fracción configurada (ej: 0.5 caja)
        for (const insumoDespacho of (prod as any).insumosAdicionales || []) {
          const cantInsumo = Number(insumoDespacho.cantidad) * cant;
          if (cantInsumo > 0) {
            await tx.insumo.update({
              where: { id: insumoDespacho.insumoId },
              data: { stockActual: { decrement: cantInsumo } },
            });
          }
        }
      }

      const isUuid = (val?: string | null): boolean => {
        if (!val || typeof val !== 'string') return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
      };

      // 2. Crear registro de Venta con detalles y pagos anidados
      const clienteId = isUuid(ventaData.clienteId) ? ventaData.clienteId : null;

      const nuevaVenta = await tx.venta.create({
        data: {
          codigoVenta,
          fechaVenta: new Date(),
          clienteId,
          totalVenta: Number(ventaData.totalVenta) || 0,
          estadoSincronizacion: (ventaData.estadoSincronizacion as any) || 'online',
          usuarioId: ventaData.usuarioId!,
          detalles: {
            create: detalles.map((d) => {
              const cant = Math.max(1, Number(d.cantidad) || 1);
              const precio = Number(d.precioUnitario) || 0;
              return {
                productoId: d.productoId,
                cantidad: cant,
                precioUnitario: precio,
                subtotal: cant * precio,
              };
            }),
          },
          pagos: {
            create: pagos.map((p) => ({
              metodoPago: normalizarMetodo(p.metodoPago),
              montoUsd: Number(p.montoUsd) || 0,
              montoVes: p.montoVes ? Number(p.montoVes) : null,
              tasaCambio: p.tasaCambio ? Number(p.tasaCambio) : null,
              referenciaPago: p.referenciaPago ? String(p.referenciaPago).trim() : null,
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
    }, { timeout: 30000, maxWait: 30000 });
  }

  async sincronizarLoteOffline(
    ventasOffline: Array<{ ventaData: Partial<Venta>; detalles: any[]; pagos: any[] }>,
  ): Promise<Venta[]> {
    if (!ventasOffline || ventasOffline.length === 0) return [];

    const isUuid = (val?: string | null): boolean => {
      if (!val || typeof val !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
    };

    const normalizarMetodo = (m?: string): any => {
      if (!m) return 'efectivo_usd';
      if (m === 'punto') return 'punto_venta';
      const valid = ['efectivo_usd', 'efectivo_ves', 'pago_movil', 'punto_venta', 'transferencia'];
      return valid.includes(m) ? m : 'efectivo_usd';
    };

    const resultados: Venta[] = [];

    for (const itemOffline of ventasOffline) {
      try {
        const ventaRes = await this.prisma.$transaction(async (tx) => {
          const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
          const rawCodigo = itemOffline.ventaData.codigoVenta?.trim();
          const codigoVenta = (rawCodigo && rawCodigo.length > 0)
            ? rawCodigo.slice(0, 20)
            : `VNT-OFF-${randomSuffix}`;

          // Si ya fue sincronizada previamente, recuperarla con todas sus relaciones
          const existe = await tx.venta.findUnique({
            where: { codigoVenta },
            include: {
              detalles: {
                include: {
                  producto: { select: { id: true, nombre: true, precioVenta: true } },
                },
              },
              pagos: true,
              cliente: { select: { id: true, nombre: true } },
              usuario: { select: { id: true, username: true } },
            },
          });

          if (existe) {
            return this.mapToDomain(existe);
          }

          // Validar y decrementar stock de productos
          const detallesValidos: Array<{
            productoId: string;
            cantidad: number;
            precioUnitario: number;
            subtotal: number;
          }> = [];

          for (const item of itemOffline.detalles || []) {
            if (!isUuid(item.productoId)) continue;
            const prod = await tx.producto.findUnique({
              where: { id: item.productoId },
            });
            if (prod) {
              const cant = Math.max(1, Number(item.cantidad) || 1);
              const precio = Number(item.precioUnitario) || Number(prod.precioVenta) || 0;
              const nuevoStock = Math.max(0, prod.stockActual - cant);
              await tx.producto.update({
                where: { id: prod.id },
                data: { stockActual: nuevoStock },
              });
              detallesValidos.push({
                productoId: prod.id,
                cantidad: cant,
                precioUnitario: precio,
                subtotal: cant * precio,
              });
            }
          }

          if (detallesValidos.length === 0) {
            console.warn(`[OfflineSync] Venta ${codigoVenta} descartada: no tiene productos válidos.`);
            return null;
          }

          // Validar pagos
          const pagosValidos = (itemOffline.pagos || []).map((p) => ({
            metodoPago: normalizarMetodo(p.metodoPago),
            montoUsd: Number(p.montoUsd) || 0,
            montoVes: p.montoVes ? Number(p.montoVes) : null,
            tasaCambio: p.tasaCambio ? Number(p.tasaCambio) : null,
            referenciaPago: p.referenciaPago?.trim() || null,
          }));

          if (pagosValidos.length === 0) {
            const sumDetalles = detallesValidos.reduce((s, d) => s + d.subtotal, 0);
            pagosValidos.push({
              metodoPago: 'efectivo_usd',
              montoUsd: sumDetalles,
              montoVes: null,
              tasaCambio: null,
              referenciaPago: null,
            });
          }

          // Validar fecha
          let fechaVenta = new Date();
          if (itemOffline.ventaData.fechaVenta) {
            const parsed = new Date(itemOffline.ventaData.fechaVenta);
            if (!isNaN(parsed.getTime())) {
              fechaVenta = parsed;
            }
          }

          const clienteId = isUuid(itemOffline.ventaData.clienteId)
            ? itemOffline.ventaData.clienteId
            : null;

          const totalCalculado = detallesValidos.reduce((s, d) => s + d.subtotal, 0);
          const totalVenta = Number(itemOffline.ventaData.totalVenta) || totalCalculado;

          const ventaCreada = await tx.venta.create({
            data: {
              codigoVenta,
              fechaVenta,
              clienteId,
              totalVenta,
              estadoSincronizacion: 'offline_synced',
              usuarioId: itemOffline.ventaData.usuarioId!,
              detalles: {
                create: detallesValidos,
              },
              pagos: {
                create: pagosValidos,
              },
            },
            include: {
              detalles: {
                include: {
                  producto: { select: { id: true, nombre: true, precioVenta: true } },
                },
              },
              pagos: true,
              cliente: { select: { id: true, nombre: true } },
              usuario: { select: { id: true, username: true } },
            },
          });

          return this.mapToDomain(ventaCreada);
        }, { timeout: 30000, maxWait: 30000 });

        if (ventaRes) {
          resultados.push(ventaRes);
        }
      } catch (err) {
        console.error(`[OfflineSync Error] Fallo al sincronizar venta individual:`, err);
      }
    }

    return resultados;
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
