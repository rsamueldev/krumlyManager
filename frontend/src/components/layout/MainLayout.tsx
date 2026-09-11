import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

const TITULOS_SECCION: Record<string, string> = {
  '/': 'Dashboard Operativo',
  '/cocina/recetas': 'Recetas Base en Cocina',
  '/productos': 'Productos Comerciales',
  '/inventario/insumos': 'Inventario de Materia Prima e Insumos',
  '/inventario/categorias': 'Gestión de Categorías',
  '/pos': 'Punto de Venta POS',
  '/gastos': 'Registro de Gastos Operativos',
  '/configuracion': 'Configuración del Sistema',
};

export const MainLayout: React.FC = () => {
  const [colapsado, setColapsado] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const tituloActual = TITULOS_SECCION[location.pathname] || 'Krumly Manager';

  return (
    <div className="flex h-screen bg-krumly-cream overflow-hidden font-body text-krumly-chocolate relative">
      {/* Sidebar Colapsable & Responsive Drawer */}
      <Sidebar
        colapsado={colapsado}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Navbar
          toggleSidebar={() => {
            if (window.innerWidth < 768) {
              setMobileOpen(!mobileOpen);
            } else {
              setColapsado(!colapsado);
            }
          }}
          tituloSeccion={tituloActual}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
