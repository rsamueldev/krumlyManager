export class LoteProduccionEntity {
  constructor(
    public readonly id: string,
    public readonly productoId: string,
    public readonly recetaId?: string | null,
    public readonly cantidadProducida: number = 0,
    public readonly fechaProduccion?: Date,
    public readonly notas?: string | null,
    public readonly usuarioId?: string,
    public readonly producto?: { id: string; nombre: string; stockActual: number },
    public readonly receta?: { id: string; nombre: string },
    public readonly usuario?: { id: string; username: string },
    public readonly createdAt?: Date,
  ) {}
}
