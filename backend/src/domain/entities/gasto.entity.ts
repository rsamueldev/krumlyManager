export type TipoGastoEnum = 'fijo' | 'variable';

export class GastoEntity {
  constructor(
    public readonly id: string,
    public readonly tipoGasto: TipoGastoEnum,
    public readonly concepto: string,
    public readonly montoUsd: number,
    public readonly montoVes?: number | null,
    public readonly tasaCambio?: number | null,
    public readonly metodoPago?: string | null,
    public readonly fechaGasto: Date = new Date(),
    public readonly categoriaId?: string | null,
    public readonly usuarioId?: string | null,
    public readonly categoria?: {
      id: string;
      nombre: string;
      tipo: string;
    } | null,
    public readonly usuario?: {
      id: string;
      username: string;
    } | null,
    public readonly createdAt?: Date,
  ) {}
}
