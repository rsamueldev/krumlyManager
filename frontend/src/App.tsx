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
import { ConfiguracionPage } from './pages/ConfiguracionPage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-lg space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-gray-800">Ocurrió un inconveniente al cargar la vista</h2>
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 font-mono text-left overflow-auto max-h-32">
              {this.state.error?.toString()}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-krumly-red hover:bg-krumly-red-dark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Reintentar y Cargar de Nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
                  <Route path="configuracion" element={<ConfiguracionPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </TasaCambioProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
