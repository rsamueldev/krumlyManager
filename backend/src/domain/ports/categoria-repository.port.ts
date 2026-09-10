import { CategoriaEntity, TipoCategoriaEnum } from '../entities/categoria.entity';

export interface CategoriaRepositoryPort {
  findAll(tipo?: TipoCategoriaEnum): Promise<CategoriaEntity[]>;
  findById(id: string): Promise<CategoriaEntity | null>;
  create(categoria: Omit<CategoriaEntity, 'id' | 'createdAt'>): Promise<CategoriaEntity>;
  update(id: string, categoria: Partial<CategoriaEntity>): Promise<CategoriaEntity>;
  delete(id: string): Promise<boolean>;
}

export const CATEGORIA_REPOSITORY_PORT = Symbol('CATEGORIA_REPOSITORY_PORT');
