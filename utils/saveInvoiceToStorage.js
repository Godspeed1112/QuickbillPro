// utils/saveInvoiceToStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveInvoiceToStorage = async (invoice, showToast = null) => {
  try {
    const stored = await AsyncStorage.getItem('savedInvoices');
    const invoices = stored ? JSON.parse(stored) : [];

    const updated = [...invoices, invoice];
    await AsyncStorage.setItem('savedInvoices', JSON.stringify(updated));

    if (showToast) {
      showToast('Invoice saved successfully', 'success');
    }
  } catch (err) {
    console.error('Save failed:', err);
    if (showToast) {
      showToast('Failed to save invoice', 'error');
    }
  }
};
