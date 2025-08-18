// contexts/CurrencyContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

interface CurrencyContextType {
  currency: string;
  updateCurrency: (newCurrency: string) => Promise<void>;
  loading: boolean;
  refreshCurrency: () => Promise<void>;
}

interface CurrencyProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "appCurrency";
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

// Helper: get default currency based on locale
const getDefaultCurrency = (): string => {
  switch (Localization.region) {
    case "GH":
      return "GHS"; // Ghana Cedi
    case "NG":
      return "NGN"; // Nigerian Naira
    case "GB":
      return "GBP"; // British Pound
    case "EU":
      return "EUR"; // Eurozone
    default:
      return "USD"; // fallback
  }
};

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState<string>(getDefaultCurrency());
  const [loading, setLoading] = useState<boolean>(true);

  // Load currency from AsyncStorage
  const loadCurrency = async (): Promise<void> => {
    try {
      const storedCurrency = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedCurrency) {
        setCurrency(storedCurrency);
      }
    } catch (error) {
      console.error("Error loading currency:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update currency and persist in storage
  const updateCurrency = async (newCurrency: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newCurrency);
      setCurrency(newCurrency);
    } catch (error) {
      console.error("Error saving currency:", error);
      throw error;
    }
  };

  useEffect(() => {
    loadCurrency();
  }, []);

  const value: CurrencyContextType = {
    currency,
    updateCurrency,
    loading,
    refreshCurrency: loadCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
