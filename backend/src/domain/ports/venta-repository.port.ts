import { Venta } from '../entities/venta.entity';

export interface VentaRepositoryPort {
  crearVenta(ventaData: Partial<Venta>, detalles: any[], pagos: any[]): Promise<Venta>;
  sincronizarLoteOffline(ventasOffline: Array<{ ventaData: Partial<Venta>; detalles: any[]; pagos: any[] }>): Promise<Venta[]>;
  obtenerTodas(): Promise<Venta[]>;
  obtenerPorId(id: string): Promise<Venta | null>;
  eliminarVenta(id: string): Promise<boolean>;
}

export const VENTA_REPOSITORY_PORT = Symbol('VentaRepositoryPort');
