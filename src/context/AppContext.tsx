
import React, { createContext, useState, useContext, ReactNode } from 'react';

type Role = 'admin' | 'user';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>('admin');
  const [isLoading, setIsLoading] = useState(false);

  const value = { role, setRole, isLoading, setIsLoading };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
