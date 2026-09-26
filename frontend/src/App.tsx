import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { TasaCambioProvider } from './context/TasaCambioContext';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecetasPage } from './pages/cocina/RecetasPage';
import { ProduccionPage } from './pages/cocina/ProduccionPage';
import { ProductosPage } from './pages/productos/ProductosPage';
import { CategoriasPage } from './pages/inventario/CategoriasPage';
import { InsumosPage } from './pages/inventario/InsumosPage';
import { MermasPage } from './pages/inventario/MermasPage';
import { PosPage } from './pages/pos/PosPage';
import { ClientesPage } from './pages/ClientesPage';
import { GastosPage } from './pages/GastosPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PlaceholderPage: React.FC<{ titulo: string }> = ({ titulo }) => (
  <div className="bg-white p-8 rounded-2xl border border-krumly-border shadow-xs text-center">
    <h2 className="font-heading text-xl font-bold text-krumly-chocolate mb-2">{titulo}</h2>
    <p className="text-xs text-gray-500">Esta sección se conectará en vivo con la API en el siguiente sub-task.</p>
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <TasaCambioProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="cocina/recetas" element={<RecetasPage />} />
                <Route path="cocina/produccion" element={<ProduccionPage />} />
                <Route path="productos" element={<ProductosPage />} />
                <Route path="inventario/insumos" element={<InsumosPage />} />
                <Route path="inventario/categorias" element={<CategoriasPage />} />
                <Route path="inventario/mermas" element={<MermasPage />} />
                <Route path="pos" element={<PosPage />} />
                <Route path="clientes" element={<ClientesPage />} />
                <Route path="gastos" element={<GastosPage />} />
                <Route path="configuracion" element={<PlaceholderPage titulo="Configuración del Sistema" />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TasaCambioProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
