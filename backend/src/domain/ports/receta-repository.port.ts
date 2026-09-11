import { RecetaEntity } from '../entities/receta.entity';

export interface CrearRecetaData {
  nombre: string;
  pesoTotalMezclaGramos: number;
  costoTotalLote: number;
  costoPorGramo: number;
  usuarioId: string;
  insumos: { insumoId: string; cantidad: number }[];
}

export interface ActualizarRecetaData {
  nombre?: string;
  pesoTotalMezclaGramos?: number;
  costoTotalLote?: number;
  costoPorGramo?: number;
  insumos?: { insumoId: string; cantidad: number }[];
}

export interface RecetaRepositoryPort {
  findAll(): Promise<RecetaEntity[]>;
  findById(id: string): Promise<RecetaEntity | null>;
  create(data: CrearRecetaData): Promise<RecetaEntity>;
  update(id: string, data: ActualizarRecetaData): Promise<RecetaEntity>;
  delete(id: string): Promise<boolean>;
}

export const RECETA_REPOSITORY_PORT = Symbol('RECETA_REPOSITORY_PORT');
