import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

const TITULOS_SECCION: Record<string, string> = {
  '/': 'Dashboard Financiero',
  '/cocina/recetas': 'Control de Recetas',
  '/productos': 'Productos Comerciales',
  '/inventario/insumos': 'Inventario de Materia Prima e Insumos',
  '/inventario/categorias': 'Gestión de Categorías',
  '/pos': 'Punto de Venta POS',
  '/gastos': 'Registro de Gastos Operativos',
  '/configuracion': 'Configuración del Sistema',
};

export const MainLayout: React.FC = () => {
  const [colapsado, setColapsado] = useState(false);
  const location = useLocation();

  const tituloActual = TITULOS_SECCION[location.pathname] || 'Krumly Manager';

  return (
    <div className="flex h-screen bg-krumly-cream overflow-hidden font-body text-krumly-chocolate">
      {/* Sidebar Colapsable */}
      <Sidebar colapsado={colapsado} />

      {/* Area Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          toggleSidebar={() => setColapsado(!colapsado)}
          tituloSeccion={tituloActual}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
