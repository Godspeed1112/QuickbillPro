// utils/firebaseUtils.ts
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Type definitions
export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
}

export interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: string;
  price: string;
}

export interface InvoiceData {
  documentType: 'invoice' | 'receipt';
  invoiceNumber: string;
  date: string;
  businessInfo: BusinessInfo;
  customerInfo: CustomerInfo;
  items: InvoiceItem[];
  taxRate: string;
  notes: string;
  currency: string;
  businessLogo?: string | null;
  customerSignature?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt?: number;
  updatedAt?: FirebaseFirestoreTypes.FieldValue;
}

export interface BusinessProfile {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  logo?: string;
  createdAt?: FirebaseFirestoreTypes.FieldValue;
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidInvoices: number;
  unpaidInvoices: number;
}

// Initialize collections
const invoicesCollection = firestore().collection('invoices');
const businessProfilesCollection = firestore().collection('businessProfiles');

// Save invoice to Firebase
export const saveInvoiceToFirebase = async (invoiceData: InvoiceData): Promise<string> => {
  try {
    const docRef = await invoicesCollection.add({
      ...invoiceData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving invoice:', error);
    throw error;
  }
};

// Get all invoices
export const getInvoicesFromFirebase = async (): Promise<(InvoiceData & { id: string })[]> => {
  try {
    const snapshot = await invoicesCollection
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (InvoiceData & { id: string })[];
  } catch (error) {
    console.error('Error getting invoices:', error);
    throw error;
  }
};

// Delete invoice
export const deleteInvoiceFromFirebase = async (invoiceId: string): Promise<void> => {
  try {
    await invoicesCollection.doc(invoiceId).delete();
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

// Update invoice
export const updateInvoiceInFirebase = async (
  invoiceId: string, 
  updateData: Partial<InvoiceData>
): Promise<void> => {
  try {
    await invoicesCollection.doc(invoiceId).update({
      ...updateData,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// Upload image to Firebase Storage
export const uploadImageToFirebase = async (imageUri: string, path: string): Promise<string> => {
  try {
    const reference = storage().ref(path);
    await reference.putFile(imageUri);
    const downloadURL = await reference.getDownloadURL();
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Save business profile
export const saveBusinessProfile = async (profileData: BusinessProfile): Promise<string> => {
  try {
    const docRef = await businessProfilesCollection.add({
      ...profileData,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving business profile:', error);
    throw error;
  }
};

// Get business profiles
export const getBusinessProfiles = async (): Promise<(BusinessProfile & { id: string })[]> => {
  try {
    const snapshot = await businessProfilesCollection.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (BusinessProfile & { id: string })[];
  } catch (error) {
    console.error('Error getting business profiles:', error);
    throw error;
  }
};

// Get invoice statistics
export const getInvoiceStatistics = async (): Promise<InvoiceStatistics> => {
  try {
    const snapshot = await invoicesCollection.get();
    const invoices = snapshot.docs.map(doc => doc.data()) as InvoiceData[];
    
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    
    return {
      totalInvoices,
      totalAmount,
      paidInvoices,
      unpaidInvoices: totalInvoices - paidInvoices,
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
};

// Get invoices by status
export const getInvoicesByStatus = async (status: InvoiceData['status']): Promise<(InvoiceData & { id: string })[]> => {
  try {
    const snapshot = await invoicesCollection
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (InvoiceData & { id: string })[];
  } catch (error) {
    console.error('Error getting invoices by status:', error);
    throw error;
  }
};

// Search invoices by customer name or invoice number
export const searchInvoices = async (searchTerm: string): Promise<(InvoiceData & { id: string })[]> => {
  try {
    const snapshot = await invoicesCollection
      .orderBy('createdAt', 'desc')
      .get();
    
    const allInvoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (InvoiceData & { id: string })[];
    
    // Client-side filtering (Firebase doesn't support complex text search)
    return allInvoices.filter(invoice => 
      invoice.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching invoices:', error);
    throw error;
  }
};