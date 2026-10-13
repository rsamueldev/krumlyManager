import { Producto } from '../services/productosService';

export type TipoGalleta = 'clasica' | 'especial' | 'premium';

/**
 * Clasifica una galleta rellena según la estructura de precios y recetas de Krumly:
 * - Premium: Pirulín ($2.85) o precio >= $2.80
 * - Especial: Oreo Krunch ($2.65), Red Velvet ($2.65), Berry Punch ($2.65) o precio entre $2.40 y $2.80
 * - Clásica: Chocochips ($2.30), Double Choco ($2.30) o precio <= $2.40
 */
export function clasificarGalleta(prod: Producto): TipoGalleta {
  const nombre = prod.nombre.toLowerCase();
  const precio = Number(prod.precioVenta) || 0;

  if (nombre.includes('pirulin') || precio >= 2.80) {
    return 'premium';
  }
  if (
    nombre.includes('oreo') ||
    nombre.includes('red velvet') ||
    nombre.includes('berry') ||
    (precio > 2.40 && precio < 2.80)
  ) {
    return 'especial';
  }
  return 'clasica';
}

/**
 * Filtra únicamente las galletas listas para conformar combos (Galletas Rellenas, no combos, no 60gr)
 */
export function obtenerGalletasParaCombos(productos: Producto[]): Producto[] {
  return productos.filter((p) => {
    if (!p.activo) return false;
    if (p.esCombo) return false;
    const nombre = p.nombre.toLowerCase();
    // Excluir galletas de 60gr de los combos de galletas rellenas
    if (nombre.includes('60gr') || nombre.includes('60 gr')) return false;
    return true;
  });
}

export interface SlotComboConfig {
  id: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  filtro: (p: Producto) => boolean;
}

/**
 * Retorna las especificaciones de ranuras (slots) requeridas por cada tipo de combo
 */
export function obtenerSlotsParaCombo(combo: Producto): SlotComboConfig[] {
  const nombreLower = combo.nombre.toLowerCase();

  // Caso 1: Double Krum (1 Especial o Premium + 1 Clásica)
  if (nombreLower.includes('double') || nombreLower.includes('doble')) {
    return [
      {
        id: 'slot-1',
        numero: 1,
        titulo: 'Galleta 1: Especial o Premium',
        subtitulo: 'Pirulín, Oreo Krunch, Red Velvet o Berry Punch',
        filtro: (p) => {
          const tipo = clasificarGalleta(p);
          return tipo === 'especial' || tipo === 'premium';
        },
      },
      {
        id: 'slot-2',
        numero: 2,
        titulo: 'Galleta 2: Clásica',
        subtitulo: 'Chocochips o Double Choco',
        filtro: (p) => {
          return clasificarGalleta(p) === 'clasica';
        },
      },
    ];
  }

  // Caso 2: Triple Krum (1 Especial/Premium + 1 Clásica + 1 Libre/Clásica)
  if (nombreLower.includes('triple') || nombreLower.includes('trio')) {
    return [
      {
        id: 'slot-1',
        numero: 1,
        titulo: 'Galleta 1: Especial o Premium',
        subtitulo: 'Pirulín, Oreo Krunch, Red Velvet o Berry Punch',
        filtro: (p) => {
          const tipo = clasificarGalleta(p);
          return tipo === 'especial' || tipo === 'premium';
        },
      },
      {
        id: 'slot-2',
        numero: 2,
        titulo: 'Galleta 2: Clásica',
        subtitulo: 'Chocochips o Double Choco',
        filtro: (p) => {
          return clasificarGalleta(p) === 'clasica';
        },
      },
      {
        id: 'slot-3',
        numero: 3,
        titulo: 'Galleta 3: Libre (Cualquier sabor)',
        subtitulo: 'Cualquier galleta rellena en stock',
        filtro: () => true,
      },
    ];
  }

  // Caso 3: Combo genérico con N items según comboItems o por defecto 2
  const cantidadItems = (combo.comboItems && combo.comboItems.length > 0)
    ? combo.comboItems.reduce((acc, ci) => acc + (ci.cantidad || 1), 0)
    : 2;

  const slots: SlotComboConfig[] = [];
  for (let i = 0; i < cantidadItems; i++) {
    slots.push({
      id: `slot-${i + 1}`,
      numero: i + 1,
      titulo: `Galleta ${i + 1}`,
      subtitulo: 'Cualquier galleta en inventario',
      filtro: () => true,
    });
  }
  return slots;
}

/**
 * Calcula cuántas cajas de este combo se pueden armar en tiempo real
 * basado en el stock actual de las galletas que lo componen.
 */
export function calcularCombosDisponibles(combo: Producto, todosProductos: Producto[]): number {
  if (combo.stockActual > 0) {
    return combo.stockActual;
  }

  const galletas = obtenerGalletasParaCombos(todosProductos);
  const nombreLower = combo.nombre.toLowerCase();

  if (nombreLower.includes('double') || nombreLower.includes('doble')) {
    const stockEspeciales = galletas
      .filter((p) => {
        const tipo = clasificarGalleta(p);
        return tipo === 'especial' || tipo === 'premium';
      })
      .reduce((sum, p) => sum + Math.max(0, p.stockActual || 0), 0);

    const stockClasicas = galletas
      .filter((p) => clasificarGalleta(p) === 'clasica')
      .reduce((sum, p) => sum + Math.max(0, p.stockActual || 0), 0);

    return Math.min(stockEspeciales, stockClasicas);
  }

  if (nombreLower.includes('triple') || nombreLower.includes('trio')) {
    const stockEspeciales = galletas
      .filter((p) => {
        const tipo = clasificarGalleta(p);
        return tipo === 'especial' || tipo === 'premium';
      })
      .reduce((sum, p) => sum + Math.max(0, p.stockActual || 0), 0);

    const stockClasicas = galletas
      .filter((p) => clasificarGalleta(p) === 'clasica')
      .reduce((sum, p) => sum + Math.max(0, p.stockActual || 0), 0);

    // Requiere al menos 1 especial y 1 clásica, y un total de 3 galletas
    const totalGalletas = stockEspeciales + stockClasicas;
    const maxPorEspeciales = stockEspeciales; // al menos 1 especial
    const maxPorClasicas = stockClasicas; // al menos 1 clásica
    const maxPorTotal = Math.floor(totalGalletas / 3);

    return Math.min(maxPorEspeciales, maxPorClasicas, maxPorTotal);
  }

  // Para cualquier otro combo
  const totalStock = galletas.reduce((sum, p) => sum + Math.max(0, p.stockActual || 0), 0);
  return Math.floor(totalStock / 2);
}
