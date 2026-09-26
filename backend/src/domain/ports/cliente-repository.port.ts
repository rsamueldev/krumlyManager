import { ClienteEntity } from '../entities/cliente.entity';

export const CLIENTE_REPOSITORY_PORT = 'CLIENTE_REPOSITORY_PORT';

export interface ClienteRepositoryPort {
  crear(cliente: {
    nombre: string;
    cedulaRif?: string | null;
    telefono?: string | null;
    ubicacion?: string | null;
    activo?: boolean;
  }): Promise<ClienteEntity>;

  obtenerTodos(filtro?: { busqueda?: string; activo?: boolean }): Promise<ClienteEntity[]>;

  obtenerPorId(id: string): Promise<ClienteEntity | null>;

  obtenerPorCedulaRif(cedulaRif: string): Promise<ClienteEntity | null>;

  actualizar(
    id: string,
    cliente: {
      nombre?: string;
      cedulaRif?: string | null;
      telefono?: string | null;
      ubicacion?: string | null;
      activo?: boolean;
    },
  ): Promise<ClienteEntity>;

  toggleActivo(id: string, activo?: boolean): Promise<ClienteEntity>;
}
