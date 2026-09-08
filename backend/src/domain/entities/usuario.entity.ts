export enum RolUsuario {
  ADMIN = 'admin',
  CAJERO = 'cajero',
}

export class UsuarioEntity {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly rol: RolUsuario,
    public readonly activo: boolean = true,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
