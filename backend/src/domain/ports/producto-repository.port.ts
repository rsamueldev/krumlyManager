import { ProductoEntity } from '../entities/producto.entity';
import { TipoUsoInsumo } from '../entities/producto.entity';

export interface InsumoAdicionalInput {
  insumoId: string;
  cantidad: number;
  tipoUso: TipoUsoInsumo;  // 'produccion' | 'despacho'
}

export interface CrearProductoData {
  nombre: string;
  categoriaId?: string;
  recetaId?: string;
  pesoMasaGramos?: number;
  costoMasaUnidad?: number;
  costoInsumosAdicionales?: number;  // sum of produccion insumos cost
  costoEmpaque?: number;             // sum of despacho insumos cost (auto)
  costoManoObra?: number;
  costoDepreciacion?: number;
  porcentajeDesperdicio?: number;
  costoDirectoTotal?: number;
  precioVenta: number;
  margenGananciaPorcentaje?: number;
  stockActual?: number;
  stockMinimo?: number;
  insumosAdicionales?: InsumoAdicionalInput[];
}

export interface ActualizarProductoData {
  nombre?: string;
  categoriaId?: string;
  recetaId?: string;
  pesoMasaGramos?: number;
  costoMasaUnidad?: number;
  costoInsumosAdicionales?: number;
  costoEmpaque?: number;
  costoManoObra?: number;
  costoDepreciacion?: number;
  porcentajeDesperdicio?: number;
  costoDirectoTotal?: number;
  precioVenta?: number;
  margenGananciaPorcentaje?: number;
  stockActual?: number;
  stockMinimo?: number;
  activo?: boolean;
  insumosAdicionales?: InsumoAdicionalInput[];
}

export interface ProductoRepositoryPort {
  findAll(): Promise<ProductoEntity[]>;
  findById(id: string): Promise<ProductoEntity | null>;
  create(data: CrearProductoData): Promise<ProductoEntity>;
  update(id: string, data: ActualizarProductoData): Promise<ProductoEntity>;
  delete(id: string): Promise<boolean>;
}

export const PRODUCTO_REPOSITORY_PORT = Symbol('PRODUCTO_REPOSITORY_PORT');
