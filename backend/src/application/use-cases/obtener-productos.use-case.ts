import { ProductoEntity } from '../../domain/entities/producto.entity';
import { ProductoRepositoryPort } from '../../domain/ports/producto-repository.port';

export class ObtenerProductosUseCase {
  constructor(private readonly productoRepository: ProductoRepositoryPort) {}

  async executeAll(): Promise<ProductoEntity[]> {
    return this.productoRepository.findAll();
  }

  async executeById(id: string): Promise<ProductoEntity | null> {
    const producto = await this.productoRepository.findById(id);
    if (!producto) {
      throw new Error(`Producto con ID ${id} no fue encontrado`);
    }
    return producto;
  }
}
