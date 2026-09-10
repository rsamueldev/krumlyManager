export enum TipoCategoriaEnum {
  PRODUCTO = 'producto',
  GASTO = 'gasto',
}

export class CategoriaEntity {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly tipo: TipoCategoriaEnum,
    public readonly createdAt?: Date,
  ) {}
}
