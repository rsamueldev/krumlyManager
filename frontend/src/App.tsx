import React from 'react';

export function App() {
  return (
    <div className="min-h-screen bg-krumly-cream flex flex-col items-center justify-center p-6">
      <div className="bg-white border border-krumly-border p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-krumly-red mb-2">Krumly Manager</h1>
        <p className="text-krumly-moka text-sm mb-6">Sistema de Gestión y Control Operativo para Repostería</p>

        <div className="bg-krumly-cream p-4 rounded-xl border border-krumly-border mb-6">
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full mb-2">
            ✓ Sprint 1: Setup Inicial Completado
          </span>
          <p className="text-xs text-krumly-chocolate">
            Frontend React + TailwindCSS <span className="font-bold text-krumly-red">(#AA1616 / #FFF3E8)</span> activo.
          </p>
        </div>

        <button className="w-full bg-krumly-red hover:bg-krumly-red-dark text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95">
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
}

export default App;
