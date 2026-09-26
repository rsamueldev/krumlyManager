import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  createCategoriaApi,
  deleteCategoriaApi,
} from '../../services/categoriasService';
import { FolderTree, Plus, RefreshCw, Trash2 } from 'lucide-react';

export const CategoriasPage: React.FC = () => {
  const {
    categorias,
    cargandoCategorias: cargando,
    obtenerCategorias,
    refrescarCategorias,
  } = useData();
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'producto' | 'gasto'>('producto');

  useEffect(() => {
    obtenerCategorias();
  }, [obtenerCategorias]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    try {
      await createCategoriaApi({ nombre: nombre.trim(), tipo });
      await refrescarCategorias();
      setNombre('');
    } catch (err: any) {
      alert(err.message || 'Error al crear la categoría');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await deleteCategoriaApi(id);
      await refrescarCategorias();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la categoría');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-krumly-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-krumly-red mb-1">
            <FolderTree className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Clasificación & Estructura</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-krumly-chocolate tracking-tight">
            Categorías Dinámicas
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Clasificación estructurada de productos comerciales y gastos operativos para reportes financieros.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => refrescarCategorias()}
            disabled={cargando}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-krumly-chocolate rounded-xl text-xs font-semibold border border-krumly-border transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${cargando ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario de Creación */}
        <div className="bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-krumly-border pb-3">
            <FolderTree className="w-5 h-5 text-krumly-red" />
            <h3 className="font-heading font-bold text-sm text-krumly-chocolate">Nueva Categoría</h3>
          </div>

          <form onSubmit={handleCrear} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Galletas Rellenas"
                className="w-full px-3.5 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Categoría</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full px-3 py-2 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
              >
                <option value="producto">Producto Comercial</option>
                <option value="gasto">Gasto Operativo</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-krumly-red hover:bg-krumly-red-dark text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Crear Categoría</span>
            </button>
          </form>
        </div>

        {/* Tabla Lista Categorías */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-krumly-border shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-krumly-chocolate border-b border-krumly-border pb-3">
            Categorías Registradas ({categorias.length})
          </h3>

          <div className="divide-y divide-krumly-border/60">
            {cargando ? (
              <p className="py-4 text-center text-xs text-gray-400">Cargando categorías...</p>
            ) : categorias.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">No hay categorías registradas.</p>
            ) : (
              categorias.map((cat) => (
                <div key={cat.id} className="py-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-krumly-chocolate">{cat.nombre}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        cat.tipo === 'producto' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {cat.tipo}
                    </span>
                  </div>

                  <button
                    onClick={() => handleEliminar(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-krumly-red hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
