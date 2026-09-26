export class ClienteEntity {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly cedulaRif?: string | null,
    public readonly telefono?: string | null,
    public readonly ubicacion?: string | null,
    public readonly activo: boolean = true,
    public readonly totalVentas?: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
