import React, { useState } from 'react';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { Bell, DollarSign, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  toggleSidebar: () => void;
  tituloSeccion?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, tituloSeccion = 'Dashboard Operativo' }) => {
  const { usuario, logout } = useAuth();
  const { tasaCambioBs, setTasaCambioBs } = useTasaCambio();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevaTasa, setNuevaTasa] = useState(tasaCambioBs.toString());

  const handleGuardarTasa = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(nuevaTasa);
    if (!isNaN(valor) && valor > 0) {
      setTasaCambioBs(valor);
      setModalAbierto(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-krumly-border px-4 sticky top-0 z-30 flex items-center justify-between shadow-xs shrink-0">
        {/* Lado Izquierdo: Botón Menú + Título */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-krumly-chocolate hover:bg-krumly-cream transition-colors cursor-pointer"
            title="Conmutar Menú Lateral"
          >
            <Menu className="w-5 h-5 text-krumly-red" />
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-krumly-red animate-pulse" />
            <h1 className="font-heading text-lg font-bold text-krumly-chocolate tracking-tight">
              {tituloSeccion}
            </h1>
          </div>
        </div>

        {/* Lado Derecho: Widget Tasa del Día + Notificaciones + Perfil */}
        <div className="flex items-center space-x-3">
          {/* Widget Tasa del Día Bs/USD */}
          <button
            onClick={() => {
              setNuevaTasa(tasaCambioBs.toString());
              setModalAbierto(true);
            }}
            className="flex items-center space-x-2 bg-krumly-cream hover:bg-[#FBE8D8] border border-krumly-border text-krumly-chocolate px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer"
            title="Haz clic para actualizar la Tasa del Día en Bolívares"
          >
            <div className="w-5 h-5 rounded-full bg-krumly-red text-white flex items-center justify-center font-bold text-[10px]">
              Bs
            </div>
            <span>Tasa del Día: <strong className="text-krumly-red font-bold">{tasaCambioBs.toFixed(2)} Bs</strong></span>
          </button>

          {/* Notificaciones */}
          <button className="p-2 text-gray-500 hover:text-krumly-red hover:bg-krumly-cream rounded-full transition-colors relative cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-krumly-red rounded-full ring-2 ring-white" />
          </button>

          {/* Badge Perfil Usuario */}
          <div className="flex items-center space-x-2 pl-2 border-l border-krumly-border">
            <div className="w-8 h-8 rounded-full bg-krumly-red text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase">
              {usuario?.username ? usuario.username.slice(0, 2) : 'AD'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-krumly-chocolate leading-none">{usuario?.username || 'Administrador'}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight uppercase">{usuario?.rol || 'Control y Gestión'}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-krumly-red rounded-lg transition-colors cursor-pointer ml-1"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal para cambiar Tasa BCV / Dólar en Bs */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-krumly-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-krumly-cream rounded-lg text-krumly-red">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-krumly-chocolate">Actualizar Tasa del Día</h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarTasa}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tasa Oficial en Bolívares (Bs / 1 USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={nuevaTasa}
                    onChange={(e) => setNuevaTasa(e.target.value)}
                    className="w-full px-4 py-2.5 bg-krumly-cream/50 border border-krumly-border rounded-xl font-bold text-lg text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                    placeholder="Ej. 40.50"
                    autoFocus
                  />
                  <span className="absolute right-4 top-3 font-bold text-xs text-gray-400">VES</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Esta tasa actualizará al instante los montos en Bolívares en todo el sistema.
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-1/2 py-2.5 border border-krumly-border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-krumly-red hover:bg-krumly-red-dark text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar Tasa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
