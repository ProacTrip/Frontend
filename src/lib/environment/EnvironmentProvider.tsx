'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface EnvironmentState {
  userCurrency: string;
  setUserCurrency: (c: string) => void;
}

const EnvironmentContext = createContext<EnvironmentState>({
  userCurrency: 'EUR',
  setUserCurrency: () => {},
});

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [userCurrency, setUserCurrency] = useState('EUR');
  return (
    <EnvironmentContext.Provider value={{ userCurrency, setUserCurrency }}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  return useContext(EnvironmentContext);
}
