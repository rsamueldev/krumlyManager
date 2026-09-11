import React, { createContext, useContext, useEffect, useState } from 'react';

interface TasaCambioContextType {
  tasaCambioBs: number;
  setTasaCambioBs: (tasa: number) => void;
  convertirUSDToVES: (montoUSD: number) => number;
}

const TasaCambioContext = createContext<TasaCambioContextType | undefined>(undefined);

export const TasaCambioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasaCambioBs, setTasaState] = useState<number>(() => {
    const saved = localStorage.getItem('krumly_tasa_bs');
    return saved ? parseFloat(saved) : 40.50;
  });

  const setTasaCambioBs = (tasa: number) => {
    setTasaState(tasa);
    localStorage.setItem('krumly_tasa_bs', tasa.toString());
  };

  const convertirUSDToVES = (montoUSD: number) => {
    return Number((montoUSD * tasaCambioBs).toFixed(2));
  };

  return (
    <TasaCambioContext.Provider value={{ tasaCambioBs, setTasaCambioBs, convertirUSDToVES }}>
      {children}
    </TasaCambioContext.Provider>
  );
};

export const useTasaCambio = () => {
  const context = useContext(TasaCambioContext);
  if (!context) {
    throw new Error('useTasaCambio debe usarse dentro de un TasaCambioProvider');
  }
  return context;
};
