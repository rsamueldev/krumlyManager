import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { GASTOS_REPOSITORY_PORT, GastosRepositoryPort } from '../../../domain/ports/gastos-repository.port';
import { TipoGastoEnum } from '../../../domain/entities/gasto.entity';

export interface RegistrarGastoInput {
  tipoGasto: TipoGastoEnum;
  concepto: string;
  montoUsd: number;
  montoVes?: number;
  tasaCambio?: number;
  metodoPago?: string;
  fechaGasto?: string | Date;
  categoriaId?: string;
  usuarioId: string;
}

@Injectable()
export class RegistrarGastoUseCase {
  constructor(
    @Inject(GASTOS_REPOSITORY_PORT)
    private readonly gastosRepo: GastosRepositoryPort,
  ) {}

  async execute(input: RegistrarGastoInput) {
    if (!input.concepto || input.concepto.trim() === '') {
      throw new BadRequestException('El concepto del gasto es obligatorio.');
    }
    if (!input.montoUsd || input.montoUsd <= 0) {
      throw new BadRequestException('El monto en USD debe ser mayor a cero.');
    }
    if (!['fijo', 'variable'].includes(input.tipoGasto)) {
      throw new BadRequestException('El tipo de gasto debe ser fijo o variable.');
    }

    const fechaFinal = input.fechaGasto ? new Date(input.fechaGasto) : new Date();

    return this.gastosRepo.registrarGasto({
      tipoGasto: input.tipoGasto,
      concepto: input.concepto.trim(),
      montoUsd: input.montoUsd,
      montoVes: input.montoVes,
      tasaCambio: input.tasaCambio,
      metodoPago: input.metodoPago,
      fechaGasto: fechaFinal,
      categoriaId: input.categoriaId,
      usuarioId: input.usuarioId,
    });
  }
}
