import { CategoriaEntity, TipoCategoriaEnum } from '../../domain/entities/categoria.entity';
import { CategoriaRepositoryPort } from '../../domain/ports/categoria-repository.port';

export interface ActualizarCategoriaDto {
  nombre?: string;
  tipo?: TipoCategoriaEnum;
}

export class ActualizarCategoriaUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepositoryPort) {}

  async execute(id: string, dto: ActualizarCategoriaDto): Promise<CategoriaEntity> {
    const categoriaExistente = await this.categoriaRepository.findById(id);
    if (!categoriaExistente) {
      throw new Error('Categoría no encontrada');
    }

    if (dto.nombre !== undefined && dto.nombre.trim().length === 0) {
      throw new Error('El nombre de la categoría no puede estar vacío');
    }

    if (dto.tipo && !Object.values(TipoCategoriaEnum).includes(dto.tipo)) {
      throw new Error('El tipo de categoría debe ser producto o gasto');
    }

    return this.categoriaRepository.update(id, {
      ...(dto.nombre && { nombre: dto.nombre.trim() }),
      ...(dto.tipo && { tipo: dto.tipo }),
    });
  }
}
