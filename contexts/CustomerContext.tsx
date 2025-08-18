// ===== COMPLETE CUSTOMER MANAGEMENT INTEGRATION =====
// This is the full implementation to replace your existing customer management

// ===== 1. CREATE: contexts/CustomerContext.ts =====
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface Customer {
  id: string;
  createdAt: number;
  [key: string]: any; // Allow additional customer properties
}

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  loadCustomers: () => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  saveCustomers: (customers: Customer[]) => Promise<void>;
}

interface CustomerProviderProps {
  children: ReactNode;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCustomers = async (): Promise<void> => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('customers');
      if (stored) {
        const parsedCustomers: Customer[] = JSON.parse(stored);
        setCustomers(parsedCustomers);
        console.log('CustomerContext: Loaded', parsedCustomers.length, 'customers');
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('CustomerContext: Error loading customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomers = async (updatedCustomers: Customer[]): Promise<void> => {
    try {
      await AsyncStorage.setItem('customers', JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);
      console.log('CustomerContext: Saved', updatedCustomers.length, 'customers');
    } catch (error) {
      console.error('CustomerContext: Error saving customers:', error);
      throw error;
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    try {
      const newCustomer: Customer = {
        ...customerData,
        id: Date.now().toString(),
        createdAt: Date.now()
      };
      const updatedCustomers = [...customers, newCustomer];
      await saveCustomers(updatedCustomers);
      return newCustomer;
    } catch (error) {
      console.error('CustomerContext: Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>): Promise<void> => {
    try {
      const updatedCustomers = customers.map(customer =>
        customer.id === customerId ? { ...customer, ...updates } : customer
      );
      await saveCustomers(updatedCustomers);
    } catch (error) {
      console.error('CustomerContext: Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (customerId: string): Promise<void> => {
    try {
      const updatedCustomers = customers.filter(customer => customer.id !== customerId);
      await saveCustomers(updatedCustomers);
    } catch (error) {
      console.error('CustomerContext: Error deleting customer:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const value: CustomerContextType = {
    customers,
    loading,
    loadCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    saveCustomers
  };

  return React.createElement(CustomerContext.Provider, { value }, children);
};

export const useCustomers = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

export { CustomerContext };