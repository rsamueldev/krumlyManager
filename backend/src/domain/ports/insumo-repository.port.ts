import { InsumoEntity } from '../entities/insumo.entity';

export interface InsumoRepositoryPort {
  findAll(): Promise<InsumoEntity[]>;
  findById(id: string): Promise<InsumoEntity | null>;
  create(insumo: Omit<InsumoEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<InsumoEntity>;
  update(id: string, insumo: Partial<InsumoEntity>): Promise<InsumoEntity>;
  delete(id: string): Promise<boolean>;
}

export const INSUMO_REPOSITORY_PORT = Symbol('INSUMO_REPOSITORY_PORT');
