import { CategoriaEntity, TipoCategoriaEnum } from '../../domain/entities/categoria.entity';
import { CategoriaRepositoryPort } from '../../domain/ports/categoria-repository.port';

export interface CrearCategoriaDto {
  nombre: string;
  tipo: TipoCategoriaEnum;
}

export class CrearCategoriaUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepositoryPort) {}

  async execute(dto: CrearCategoriaDto): Promise<CategoriaEntity> {
    if (!dto.nombre || dto.nombre.trim().length === 0) {
      throw new Error('El nombre de la categoría es obligatorio');
    }

    if (!Object.values(TipoCategoriaEnum).includes(dto.tipo)) {
      throw new Error('El tipo de categoría debe ser producto o gasto');
    }

    return this.categoriaRepository.create({
      nombre: dto.nombre.trim(),
      tipo: dto.tipo,
    });
  }
}
