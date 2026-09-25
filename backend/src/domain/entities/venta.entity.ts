export enum EstadoSincronizacion {
  ONLINE = 'online',
  OFFLINE_PENDING = 'offline_pending',
  OFFLINE_SYNCED = 'offline_synced',
}

export enum MetodoPago {
  EFECTIVO_USD = 'efectivo_usd',
  EFECTIVO_VES = 'efectivo_ves',
  PAGO_MOVIL = 'pago_movil',
  PUNTO_VENTA = 'punto_venta',
  TRANSFERENCIA = 'transferencia',
}

export interface VentaDetalleItem {
  id?: string;
  ventaId?: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  producto?: {
    id: string;
    nombre: string;
    precioVenta: number;
  };
}

export interface VentaPagoItem {
  id?: string;
  ventaId?: string;
  metodoPago: MetodoPago;
  montoUsd: number;
  montoVes?: number;
  tasaCambio?: number;
  referenciaPago?: string;
}

export interface Venta {
  id: string;
  codigoVenta: string;
  fechaVenta: Date;
  clienteId?: string | null;
  totalVenta: number;
  estadoSincronizacion: EstadoSincronizacion;
  usuarioId: string;
  detalles?: VentaDetalleItem[];
  pagos?: VentaPagoItem[];
  cliente?: {
    id: string;
    nombre: string;
  } | null;
  usuario?: {
    id: string;
    username: string;
  };
  createdAt?: Date;
}
