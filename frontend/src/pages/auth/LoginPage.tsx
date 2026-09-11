import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Cookie, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas o error de autenticación');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-krumly-cream flex flex-col items-center justify-center p-4 font-body text-krumly-chocolate">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-krumly-border shadow-xl space-y-6">
        
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-krumly-red rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-krumly-red/20">
            <Cookie className="w-8 h-8" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-krumly-chocolate tracking-tight">
            Krumly <span className="text-krumly-red">Manager</span>
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Sistema Integrado de Control y Gestión de Producción
          </p>
        </div>

        {/* Alerta Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@krumly.com"
                className="w-full pl-10 pr-4 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-krumly-cream/30 border border-krumly-border rounded-xl text-xs font-bold text-krumly-chocolate focus:ring-2 focus:ring-krumly-red focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-krumly-red hover:bg-krumly-red-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-krumly-red/20 transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 mt-2"
          >
            <span>{cargando ? 'Autenticando...' : 'Iniciar Sesión'}</span>
            {!cargando && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
