import { UsuarioEntity } from '../entities/usuario.entity';

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UsuarioEntity | null>;
  findById(id: string): Promise<UsuarioEntity | null>;
  create(usuario: Omit<UsuarioEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UsuarioEntity>;
}

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');
