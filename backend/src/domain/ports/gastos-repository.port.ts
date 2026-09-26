import { GastoEntity, TipoGastoEnum } from '../entities/gasto.entity';

export const GASTOS_REPOSITORY_PORT = Symbol('GASTOS_REPOSITORY_PORT');

export interface RegistrarGastoData {
  tipoGasto: TipoGastoEnum;
  concepto: string;
  montoUsd: number;
  montoVes?: number;
  tasaCambio?: number;
  metodoPago?: string;
  fechaGasto?: Date;
  categoriaId?: string;
  usuarioId: string;
}

export interface GastosRepositoryPort {
  registrarGasto(data: RegistrarGastoData): Promise<GastoEntity>;
  obtenerGastos(limit?: number): Promise<GastoEntity[]>;
  eliminarGasto(id: string): Promise<boolean>;
}
