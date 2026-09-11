import { ProductoRepositoryPort } from '../../domain/ports/producto-repository.port';

export class EliminarProductoUseCase {
  constructor(private readonly productoRepository: ProductoRepositoryPort) {}

  async execute(id: string): Promise<boolean> {
    const producto = await this.productoRepository.findById(id);
    if (!producto) {
      throw new Error(`Producto con ID ${id} no fue encontrado`);
    }
    return this.productoRepository.delete(id);
  }
}
