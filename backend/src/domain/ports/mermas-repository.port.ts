import { MermaEntity } from '../entities/merma.entity';

export const MERMAS_REPOSITORY_PORT = Symbol('MERMAS_REPOSITORY_PORT');

export interface RegistrarMermaData {
  productoId: string;
  cantidad: number;
  motivo: string;
  usuarioId: string;
}

export interface MermasRepositoryPort {
  registrarMerma(data: RegistrarMermaData): Promise<MermaEntity>;
  obtenerHistorialMermas(limit?: number): Promise<MermaEntity[]>;
}
