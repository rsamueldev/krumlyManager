export enum UnidadMedidaEnum {
  GRAMOS = 'gramos',
  ML = 'ml',
  UNIDADES = 'unidades',
}

export class InsumoEntity {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly unidadMedida: UnidadMedidaEnum,
    public readonly cantidadEmpaque: number,
    public readonly precioCompra: number,
    public readonly costoUnitario: number,
    public readonly stockActual: number = 0,
    public readonly stockMinimo: number = 500,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  public static calcularCostoUnitario(precioCompra: number, cantidadEmpaque: number): number {
    if (cantidadEmpaque <= 0) return 0;
    return Number((precioCompra / cantidadEmpaque).toFixed(4));
  }
}
