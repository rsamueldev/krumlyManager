export class MermaEntity {
  constructor(
    public readonly id: string,
    public readonly productoId: string,
    public readonly cantidad: number,
    public readonly motivo: string,
    public readonly fechaMerma: Date,
    public readonly usuarioId: string,
    public readonly producto?: {
      id: string;
      nombre: string;
      costoDirectoTotal: number;
      stockActual: number;
    },
    public readonly usuario?: {
      id: string;
      username: string;
    },
    public readonly createdAt?: Date,
  ) {}
}
