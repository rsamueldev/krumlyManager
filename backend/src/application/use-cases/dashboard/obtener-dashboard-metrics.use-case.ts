import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import {
  AlertaStockBajo,
  DashboardMetricsEntity,
  DesgloseProductoPeriodo,
  TopProductoVendido,
} from '../../../domain/entities/dashboard-metrics.entity';

@Injectable()
export class ObtenerDashboardMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(periodo?: string, desde?: string, hasta?: string): Promise<DashboardMetricsEntity> {
    const periodoNormalizado = (periodo || 'hoy').toLowerCase();
    let fechaInicio: Date | undefined;
    let fechaFin: Date | undefined;

    const ahora = new Date();

    if (desde && hasta) {
      fechaInicio = new Date(desde);
      fechaFin = new Date(hasta);
    } else if (periodoNormalizado === 'hoy') {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
      fechaFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    } else if (periodoNormalizado === 'semana') {
      const diaSemana = ahora.getDay();
      const diffDias = diaSemana === 0 ? 6 : diaSemana - 1; // Lunes como primer día de la semana
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diffDias, 0, 0, 0, 0);
      fechaFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    } else if (periodoNormalizado === 'mes') {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
      fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (periodoNormalizado === 'todos' || periodoNormalizado === 'historico') {
      fechaInicio = undefined;
      fechaFin = undefined;
    } else {
      // Default fallback a 'hoy'
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
      fechaFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    }

    const filtroFechaVenta = fechaInicio && fechaFin ? { fechaVenta: { gte: fechaInicio, lte: fechaFin } } : {};
    const filtroFechaGasto = fechaInicio && fechaFin ? { fechaGasto: { gte: fechaInicio, lte: fechaFin } } : {};
    const filtroFechaMerma = fechaInicio && fechaFin ? { fechaMerma: { gte: fechaInicio, lte: fechaFin } } : {};

    // 1. Obtener Ventas del período y detalle de productos/COGS
    const ventas = await this.prisma.venta.findMany({
      where: filtroFechaVenta,
      include: {
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true, esCombo: true, costoDirectoTotal: true } },
          },
        },
      },
      orderBy: { fechaVenta: 'desc' },
    });

    const cantidadVentas = ventas.length;
    let totalVentasUsd = 0;
    let totalUnidadesVendidas = 0;
    let cogsUsd = 0;

    const mapaProductos = new Map<
      string,
      {
        productoId: string;
        nombre: string;
        esCombo: boolean;
        cantidadVendida: number;
        totalVentasUsd: number;
        costoTotal: number;
      }
    >();

    for (const v of ventas) {
      totalVentasUsd += Number(v.totalVenta) || 0;

      for (const d of v.detalles) {
        const cant = Number(d.cantidad) || 0;
        const subtotal = Number(d.subtotal) || 0;
        const costoUnit = d.producto ? Number(d.producto.costoDirectoTotal) || 0 : 0;
        const costoDetalle = cant * costoUnit;

        totalUnidadesVendidas += cant;
        cogsUsd += costoDetalle;

        if (mapaProductos.has(d.productoId)) {
          const item = mapaProductos.get(d.productoId)!;
          item.cantidadVendida += cant;
          item.totalVentasUsd += subtotal;
          item.costoTotal += costoDetalle;
        } else {
          mapaProductos.set(d.productoId, {
            productoId: d.productoId,
            nombre: d.producto ? d.producto.nombre : 'Producto',
            esCombo: Boolean(d.producto?.esCombo),
            cantidadVendida: cant,
            totalVentasUsd: subtotal,
            costoTotal: costoDetalle,
          });
        }
      }
    }

    // Desglose de todos los productos vendidos en el período
    const desgloseProductos: DesgloseProductoPeriodo[] = Array.from(mapaProductos.values())
      .map((item) => ({
        productoId: item.productoId,
        nombre: item.nombre,
        esCombo: item.esCombo,
        cantidadVendida: item.cantidadVendida,
        totalVentasUsd: Number(item.totalVentasUsd.toFixed(2)),
      }))
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida);

    // Top 5 Productos por recaudación
    const topProductos: TopProductoVendido[] = Array.from(mapaProductos.values())
      .map((item) => ({
        productoId: item.productoId,
        nombre: item.nombre,
        cantidadVendida: item.cantidadVendida,
        totalVentasUsd: Number(item.totalVentasUsd.toFixed(2)),
        gananciaUsd: Number((item.totalVentasUsd - item.costoTotal).toFixed(2)),
      }))
      .sort((a, b) => b.totalVentasUsd - a.totalVentasUsd)
      .slice(0, 5);

    const ticketPromedioUsd = cantidadVentas > 0 ? Number((totalVentasUsd / cantidadVentas).toFixed(2)) : 0;

    // 2. Obtener Gastos Operativos del período
    const gastos = await this.prisma.gasto.findMany({
      where: filtroFechaGasto,
    });

    let gastosFijosUsd = 0;
    let gastosVariablesUsd = 0;

    for (const g of gastos) {
      const monto = Number(g.montoUsd) || 0;
      if (g.tipoGasto === 'fijo') {
        gastosFijosUsd += monto;
      } else {
        gastosVariablesUsd += monto;
      }
    }

    const gastosTotalesUsd = gastosFijosUsd + gastosVariablesUsd;

    // 3. Obtener Mermas del período
    const mermas = await this.prisma.merma.findMany({
      where: filtroFechaMerma,
      include: {
        producto: { select: { costoDirectoTotal: true } },
      },
    });

    const cantidadMermas = mermas.length;
    let mermasTotalesUsd = 0;

    for (const m of mermas) {
      const cant = Number(m.cantidad) || 0;
      const costoUnit = m.producto ? Number(m.producto.costoDirectoTotal) || 0 : 0;
      mermasTotalesUsd += cant * costoUnit;
    }

    // 4. Cálculos Financieros y Punto de Equilibrio
    const utilidadBrutaUsd = Number((totalVentasUsd - cogsUsd).toFixed(2));
    const utilidadNetaUsd = Number((utilidadBrutaUsd - gastosTotalesUsd - mermasTotalesUsd).toFixed(2));
    const margenNetoPorcentaje =
      totalVentasUsd > 0 ? Number(((utilidadNetaUsd / totalVentasUsd) * 100).toFixed(1)) : 0;

    const margenBrutoRatio = totalVentasUsd > 0 ? (totalVentasUsd - cogsUsd) / totalVentasUsd : 0;
    const totalGastosYMermasUsd = gastosTotalesUsd + mermasTotalesUsd;

    let puntoEquilibrioUsd: number;
    if (utilidadNetaUsd >= 0) {
      puntoEquilibrioUsd = Number(totalVentasUsd.toFixed(2));
    } else if (margenBrutoRatio > 0.01) {
      puntoEquilibrioUsd = Number((totalGastosYMermasUsd / margenBrutoRatio).toFixed(2));
    } else {
      puntoEquilibrioUsd = Number((cogsUsd + totalGastosYMermasUsd).toFixed(2));
    }

    const porcentajePuntoEquilibrioAlcanzado =
      puntoEquilibrioUsd > 0
        ? Math.min(100, Number(((totalVentasUsd / puntoEquilibrioUsd) * 100).toFixed(1)))
        : 100;

    // 5. Alertas de Stock Bajo: Solo para CONGELACIÓN (Freezer) en galletas crudas y stock de insumos
    const productosStockBajo = await this.prisma.producto.findMany({
      where: {
        activo: true,
        esCombo: false, // Los combos son cajas/packs, no masas en freezer
      },
      select: { id: true, nombre: true, stockCongelador: true, stockMinimo: true },
    });

    const insumosStockBajo = await this.prisma.insumo.findMany({
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true, unidadMedida: true },
    });

    const alertasStock: AlertaStockBajo[] = [];

    for (const p of productosStockBajo) {
      const cong = Number(p.stockCongelador) || 0;
      const min = Number(p.stockMinimo) || 0;
      if (cong <= min) {
        alertasStock.push({
          tipo: 'producto',
          id: p.id,
          nombre: p.nombre,
          stockActual: cong,
          stockCongelador: cong,
          stockMinimo: min,
          unidadMedida: 'masas',
        });
      }
    }

    for (const i of insumosStockBajo) {
      const current = Number(i.stockActual) || 0;
      const min = Number(i.stockMinimo) || 0;
      if (current <= min) {
        alertasStock.push({
          tipo: 'insumo',
          id: i.id,
          nombre: i.nombre,
          stockActual: current,
          stockMinimo: min,
          unidadMedida: i.unidadMedida,
        });
      }
    }

    // Tasa por defecto aproximada para cálculo inicial en backend
    const totalVentasVes = Number((totalVentasUsd * 40.5).toFixed(2));

    return new DashboardMetricsEntity(
      Number(totalVentasUsd.toFixed(2)),
      totalVentasVes,
      cantidadVentas,
      Number(cogsUsd.toFixed(2)),
      Number(gastosFijosUsd.toFixed(2)),
      Number(gastosVariablesUsd.toFixed(2)),
      Number(gastosTotalesUsd.toFixed(2)),
      Number(mermasTotalesUsd.toFixed(2)),
      cantidadMermas,
      utilidadBrutaUsd,
      utilidadNetaUsd,
      margenNetoPorcentaje,
      puntoEquilibrioUsd,
      porcentajePuntoEquilibrioAlcanzado,
      topProductos,
      alertasStock,
      totalUnidadesVendidas,
      ticketPromedioUsd,
      desgloseProductos,
      periodoNormalizado,
    );
  }
}
