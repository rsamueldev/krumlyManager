import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChefHat,
  Cookie,
  CookingPot,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';

interface SidebarProps {
  colapsado: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ colapsado, mobileOpen, onCloseMobile }) => {
  const { logout } = useAuth();

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cocina/recetas', label: 'Recetas', icon: ChefHat },
    { to: '/cocina/produccion', label: 'Lotes de Producción', icon: CookingPot },
    { to: '/productos', label: 'Productos', icon: Cookie },
    { to: '/inventario/insumos', label: 'Materia Prima', icon: Package },
    { to: '/inventario/categorias', label: 'Categorías', icon: FolderTree },
    { to: '/pos', label: 'Punto de Venta (POS)', icon: ShoppingCart },
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/gastos', label: 'Gastos Operativos', icon: CreditCard },
    { to: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <>
      {/* Overlay Backdrop para Mobile Drawer */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Aside Component */}
      <aside
        className={`bg-krumly-cream text-krumly-chocolate flex flex-col transition-all duration-300 ease-in-out border-r border-krumly-border 
        fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform md:transform-none md:static md:z-auto md:shadow-none
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${colapsado ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 bg-white flex items-center justify-between px-4 border-b border-krumly-border shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-krumly-red flex items-center justify-center text-white shrink-0 shadow-xs">
              <Cookie className="w-6 h-6" />
            </div>
            {(!colapsado || mobileOpen) && (
              <div>
                <h2 className="font-heading font-bold text-base text-krumly-chocolate leading-tight tracking-wide">
                  Krumly <span className="text-krumly-red">Manager</span>
                </h2>
                <p className="text-[10px] text-gray-500 font-medium leading-tight">Control y Gestión</p>
              </div>
            )}
          </div>

          {/* Botón cerrar para móvil */}
          <button
            onClick={onCloseMobile}
            className="md:hidden text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Elementos de Navegación */}
        <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-3 rounded-xl transition-all font-medium text-xs ${
                    isActive
                      ? 'bg-krumly-red text-white font-bold shadow-md shadow-krumly-red/20'
                      : 'text-krumly-chocolate/80 hover:bg-[#FBE8D8] hover:text-krumly-chocolate'
                  } ${colapsado && !mobileOpen ? 'justify-center px-0' : ''}`
                }
                title={colapsado && !mobileOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {(!colapsado || mobileOpen) && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-krumly-border shrink-0">
          <button
            onClick={() => {
              onCloseMobile();
              logout();
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-krumly-red hover:bg-red-50 hover:text-krumly-red-dark transition-colors cursor-pointer ${
              colapsado && !mobileOpen ? 'justify-center px-0' : ''
            }`}
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(!colapsado || mobileOpen) && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
