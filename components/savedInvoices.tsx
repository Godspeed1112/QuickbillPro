// components/savedInvoices.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SavedInvoicesManager = ({ showToast, onPrintInvoice }) => {
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedInvoices();
  }, []);

  const loadSavedInvoices = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedInvoices');
      if (stored) {
        setSavedInvoices(JSON.parse(stored));
      }
    } catch (error) {
      showToast('Error loading saved invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId) => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = savedInvoices.filter(invoice => invoice.id !== invoiceId);
              setSavedInvoices(updated);
              await AsyncStorage.setItem('savedInvoices', JSON.stringify(updated));
              showToast('Invoice deleted', 'success');
            } catch (error) {
              showToast('Error deleting invoice', 'error');
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatCurrency = (amount, currencyCode = 'GHC') => {
    const symbols = {
      'GHC': '₵',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'NGN': '₦',
      'ZAR': 'R'
    };
    return `${symbols[currencyCode] || ''}${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading saved invoices...</Text>
      </View>
    );
  }

  if (savedInvoices.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Feather name="folder" size={28} color="white" />
            <Text style={styles.headerText}>Saved Invoices</Text>
          </View>
          <Text style={styles.headerSubtext}>Manage your saved invoices and receipts</Text>
        </View>
        
        <View style={styles.emptyState}>
          <Feather name="folder" size={64} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>No Saved Invoices</Text>
          <Text style={styles.emptyStateText}>
            Create your first invoice to see it here
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Feather name="folder" size={28} color="white" />
          <Text style={styles.headerText}>Saved Invoices</Text>
        </View>
        <Text style={styles.headerSubtext}>
          {savedInvoices.length} saved {savedInvoices.length === 1 ? 'document' : 'documents'}
        </Text>
      </View>

      <View style={styles.section}>
        {savedInvoices.map((invoice) => (
          <View key={invoice.id} style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceNumber}>
                  {invoice.documentType?.toUpperCase()} #{invoice.invoiceNumber}
                </Text>
                <Text style={styles.invoiceDate}>
                  {formatDate(invoice.createdAt)}
                </Text>
                <Text style={styles.customerName}>
                  {invoice.customerInfo?.name || 'Unknown Customer'}
                </Text>
              </View>
              <View style={styles.invoiceAmount}>
                <Text style={styles.totalAmount}>
                  {formatCurrency(invoice.total || 0, invoice.currency)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
                  <Text style={styles.statusText}>
                    {invoice.status || 'Draft'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.invoiceActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2563eb' }]}
                onPress={() => onPrintInvoice(invoice)}
              >
                <Feather name="printer" size={16} color="white" />
                <Text style={styles.actionBtnText}>Print</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                onPress={() => shareInvoice(invoice)}
              >
                <Feather name="share" size={16} color="white" />
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#dc2626' }]}
                onPress={() => deleteInvoice(invoice.id)}
              >
                <Feather name="trash-2" size={16} color="white" />
                <Text style={styles.actionBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return '#10b981';
    case 'pending':
      return '#f59e0b';
    case 'overdue':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const shareInvoice = (invoice) => {
  // Implementation for sharing invoice
  console.log('Sharing invoice:', invoice.invoiceNumber);
};

const styles = {
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 24,
    borderRadius: 8,
    marginBottom: 24,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 48,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 32,
  },
  invoiceCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#374151',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 14,
  },
};