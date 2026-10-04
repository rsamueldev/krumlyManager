import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import {
  AlertaStockBajo,
  DashboardMetricsEntity,
  TopProductoVendido,
} from '../../../domain/entities/dashboard-metrics.entity';

@Injectable()
export class ObtenerDashboardMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<DashboardMetricsEntity> {
    // 1. Obtener Ventas y Detalle COGS
    const ventas = await this.prisma.venta.findMany({
      include: {
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true, costoDirectoTotal: true } },
          },
        },
      },
    });

    const cantidadVentas = ventas.length;
    let totalVentasUsd = 0;
    let cogsUsd = 0;

    const mapaTopProductos = new Map<
      string,
      { productoId: string; nombre: string; cantidadVendida: number; totalVentasUsd: number; costoTotal: number }
    >();

    for (const v of ventas) {
      totalVentasUsd += Number(v.totalVenta) || 0;

      for (const d of v.detalles) {
        const cant = Number(d.cantidad) || 0;
        const subtotal = Number(d.subtotal) || 0;
        const costoUnit = d.producto ? Number(d.producto.costoDirectoTotal) || 0 : 0;
        const costoDetalle = cant * costoUnit;

        cogsUsd += costoDetalle;

        if (mapaTopProductos.has(d.productoId)) {
          const item = mapaTopProductos.get(d.productoId)!;
          item.cantidadVendida += cant;
          item.totalVentasUsd += subtotal;
          item.costoTotal += costoDetalle;
        } else {
          mapaTopProductos.set(d.productoId, {
            productoId: d.productoId,
            nombre: d.producto ? d.producto.nombre : 'Producto',
            cantidadVendida: cant,
            totalVentasUsd: subtotal,
            costoTotal: costoDetalle,
          });
        }
      }
    }

    // Top 5 Productos por Ventas
    const topProductos: TopProductoVendido[] = Array.from(mapaTopProductos.values())
      .map((item) => ({
        productoId: item.productoId,
        nombre: item.nombre,
        cantidadVendida: item.cantidadVendida,
        totalVentasUsd: Number(item.totalVentasUsd.toFixed(2)),
        gananciaUsd: Number((item.totalVentasUsd - item.costoTotal).toFixed(2)),
      }))
      .sort((a, b) => b.totalVentasUsd - a.totalVentasUsd)
      .slice(0, 5);

    // 2. Obtener Gastos Operativos (Fijos vs Variables)
    const gastos = await this.prisma.gasto.findMany();
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

    // 3. Obtener Mermas y Descartes
    const mermas = await this.prisma.merma.findMany({
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

    // Punto de Equilibrio corregido:
    // Meta de Ventas = (Gastos Operativos Totales + Mermas) / Ratio Margen Bruto
    //
    // Lógica: Por cada $1 vendido, el Ratio Margen Bruto indica cuánto queda
    // después de pagar el costo directo de los productos (COGS).
    // Ese remanente es lo que puede cubrir los gastos operativos (fijos + variables)
    // y las pérdidas por mermas. La meta es el nivel de ventas donde ese remanente
    // iguala exactamente la suma de todos los gastos y pérdidas del período.
    //
    // Si utilidadNeta >= 0, el equilibrio ya fue superado por las ventas actuales:
    // la meta real es igual a las ventas actuales (100% de progreso).

    const margenBrutoRatio = totalVentasUsd > 0 ? (totalVentasUsd - cogsUsd) / totalVentasUsd : 0;
    const totalGastosYMermasUsd = gastosTotalesUsd + mermasTotalesUsd;

    let puntoEquilibrioUsd: number;
    if (utilidadNetaUsd >= 0) {
      // El negocio ya está en equilibrio o con ganancia — no hay meta que cubrir
      puntoEquilibrioUsd = Number(totalVentasUsd.toFixed(2));
    } else if (margenBrutoRatio > 0.01) {
      // Caso normal: dividir total de gastos+mermas entre el margen bruto
      puntoEquilibrioUsd = Number((totalGastosYMermasUsd / margenBrutoRatio).toFixed(2));
    } else {
      // Margen bruto casi cero o negativo: la meta mínima es cubrir COGS + gastos
      puntoEquilibrioUsd = Number((cogsUsd + totalGastosYMermasUsd).toFixed(2));
    }

    const porcentajePuntoEquilibrioAlcanzado =
      puntoEquilibrioUsd > 0
        ? Math.min(100, Number(((totalVentasUsd / puntoEquilibrioUsd) * 100).toFixed(1)))
        : 100;

    // 5. Alertas de Stock Bajo (Productos e Insumos)
    const productosStockBajo = await this.prisma.producto.findMany({
      where: { stockActual: { lte: this.prisma.producto.fields.stockMinimo } },
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true },
    });

    const insumosStockBajo = await this.prisma.insumo.findMany({
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true, unidadMedida: true },
    });

    const alertasStock: AlertaStockBajo[] = [];

    for (const p of productosStockBajo) {
      if (p.stockActual <= p.stockMinimo) {
        alertasStock.push({
          tipo: 'producto',
          id: p.id,
          nombre: p.nombre,
          stockActual: p.stockActual,
          stockMinimo: p.stockMinimo,
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

    // Tasa por defecto para VES estimado en dashboard backend (aprox)
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
    );
  }
}
