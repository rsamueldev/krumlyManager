import React, { useEffect, useState } from 'react';
import {
  Categoria,
  createCategoriaApi,
  deleteCategoriaApi,
  fetchCategoriasApi,
} from '../../services/categoriasService';
import { FolderTree, Plus, Trash2 } from 'lucide-react';

export const CategoriasPage: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'producto' | 'gasto'>('producto');

  const cargar = async () => {
    setCargando(true);
    const data = await fetchCategoriasApi();
    setCategorias(data);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    try {
      const nueva = await createCategoriaApi({ nombre: nombre.trim(), tipo });
      setCategorias([...categorias, nueva]);
      setNombre('');
    } catch (err: any) {
      alert(err.message || 'Error al crear la categoría');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    await deleteCategoriaApi(id);
    setCategorias(categorias.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-heading text-xl font-bold text-krumly-chocolate">
          Gestión de Categorías Dinámicas
        </h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Clasificación de Productos Comerciales y Gastos Operativos
        </p>
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
