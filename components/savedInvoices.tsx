// components/savedInvoices.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share, TextInput, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import CloudFiles from './CloudFiles';
import { router } from 'expo-router';

export const SavedInvoicesManager = ({ showToast, onPrintInvoice, onEditInvoice }) => {
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const filters = ['all', 'paid', 'pending', 'overdue', 'draft'];
  const sortOptions = [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'customer', label: 'Customer' },
    { key: 'number', label: 'Invoice #' }
  ];

  useEffect(() => {
    loadSavedInvoices();
  }, []);

  useEffect(() => {
    filterAndSortInvoices();
  }, [savedInvoices, searchQuery, selectedFilter, sortBy, sortOrder]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedInvoices();
    setRefreshing(false);
    showToast('Invoices refreshed', 'success');
  };
  

  const filterAndSortInvoices = () => {
    let filtered = [...savedInvoices];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(invoice =>
        invoice.customerInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.documentType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(invoice =>
        (invoice.status || 'draft').toLowerCase() === selectedFilter.toLowerCase()
      );
    }
  

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt || a.date);
          bValue = new Date(b.createdAt || b.date);
          break;
        case 'amount':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'customer':
          aValue = (a.customerInfo?.name || '').toLowerCase();
          bValue = (b.customerInfo?.name || '').toLowerCase();
          break;
        case 'number':
          aValue = a.invoiceNumber || '';
          bValue = b.invoiceNumber || '';
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredInvoices(filtered);
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

  const duplicateInvoice = async (invoice) => {
    try {
      const newInvoice = {
        ...invoice,
        id: Date.now().toString(),
        invoiceNumber: `${invoice.invoiceNumber}-COPY`,
        createdAt: Date.now(),
        status: 'draft'
      };

      const updated = [newInvoice, ...savedInvoices];
      setSavedInvoices(updated);
      await AsyncStorage.setItem('savedInvoices', JSON.stringify(updated));
      showToast('Invoice duplicated', 'success');
    } catch (error) {
      showToast('Error duplicating invoice', 'error');
    }
  };

  const exportInvoices = async () => {
    try {
      const csvData = generateCSV(filteredInvoices);
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .header { background-color: #32006bff; color: white; padding: 20px; text-align: center; }
              .summary { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
              pre { background-color: #f8f9fa; padding: 15px; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Invoice Export Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="summary">
              <h2>Summary</h2>
              <p>Total Invoices: ${filteredInvoices.length}</p>
              <p>Total Amount: ${formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0))}</p>
            </div>
            <h2>Invoice Data (CSV Format)</h2>
            <pre>${csvData}</pre>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Invoices Report',
      });
    } catch (error) {
      showToast('Error exporting invoices', 'error');
    }
  };

  const generateCSV = (invoices) => {
    const headers = ['Invoice Number', 'Document Type', 'Customer', 'Date', 'Total', 'Currency', 'Status'];
    const rows = invoices.map(invoice => [
      invoice.invoiceNumber || '',
      invoice.documentType || '',
      invoice.customerInfo?.name || '',
      formatDate(invoice.createdAt || invoice.date),
      invoice.total || 0,
      invoice.currency || '',
      invoice.status || 'draft'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
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
      <View style={styles.container}>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Feather name="folder" size={28} color="#ffffffff" />
          <Text style={styles.headerText}>Saved Invoices</Text>
        </View>
        <Text style={styles.headerSubtext}>
          {filteredInvoices.length} of {savedInvoices.length} {savedInvoices.length === 1 ? 'document' : 'documents'}
        </Text>
        
        {/* Export Button */}
        <TouchableOpacity style={styles.exportBtn} onPress={exportInvoices}>
          <Feather name="download" size={16} color="white" />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>
  <TouchableOpacity
    style={{
    backgroundColor: '#ce020cff',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    
  }}
  onPress={() => router.push('/CloudFiles')}
>
  <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
    View Cloud Files
  </Text>
</TouchableOpacity>


      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.activeFilterTab
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter && styles.activeFilterTabText
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort Controls */}
        <View style={styles.sortControls}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortBtn,
                  sortBy === option.key && styles.activeSortBtn
                ]}
                onPress={() => setSortBy(option.key)}
              >
                <Text style={[
                  styles.sortBtnText,
                  sortBy === option.key && styles.activeSortBtnText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.sortOrderBtn}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Feather
              name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={16}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Invoice List */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          {filteredInvoices.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Feather name="search" size={48} color="#9ca3af" />
              <Text style={styles.noResultsTitle}>No invoices found</Text>
              <Text style={styles.noResultsText}>
                Try adjusting your search or filter criteria
              </Text>
            </View>
          ) : (
            filteredInvoices.map((invoice) => (
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

                  {onEditInvoice && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#7c3aed' }]}
                      onPress={() => onEditInvoice(invoice)}
                    >
                      <Feather name="edit" size={16} color="white" />
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                    onPress={() => duplicateInvoice(invoice)}
                  >
                    <Feather name="copy" size={16} color="white" />
                    <Text style={styles.actionBtnText}>Copy</Text>
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
            ))
          )}
        </View>
      </ScrollView>
    </View>
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

const shareInvoice = async (invoice) => {
  try {
    // Enhanced HTML template with better formatting
    const html = `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              background-color: #32006bff; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .invoice-details {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-label {
              font-weight: bold;
              color: #374151;
            }
            .detail-value {
              color: #6b7280;
            }
            .total-amount {
              font-size: 24px;
              font-weight: bold;
              color: #32006bff;
              text-align: center;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${invoice.documentType?.toUpperCase()} #${invoice.invoiceNumber}</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="invoice-details">
            <div class="detail-row">
              <span class="detail-label">Document Type:</span>
              <span class="detail-value">${invoice.documentType?.toUpperCase() || 'INVOICE'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Invoice Number:</span>
              <span class="detail-value">#${invoice.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${new Date(invoice.createdAt || invoice.date).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Customer:</span>
              <span class="detail-value">${invoice.customerInfo?.name || 'Unknown Customer'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">${invoice.status || 'Draft'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Currency:</span>
              <span class="detail-value">${invoice.currency || 'GHC'}</span>
            </div>
          </div>
          
          <div class="total-amount">
            Total: ${invoice.currency || ''}${(invoice.total || 0).toFixed(2)}
          </div>
          
          ${invoice.customerInfo?.email ? `
            <div class="invoice-details">
              <h3>Customer Information</h3>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${invoice.customerInfo.email}</span>
              </div>
              ${invoice.customerInfo.address ? `
                <div class="detail-row">
                  <span class="detail-label">Address:</span>
                  <span class="detail-value">${invoice.customerInfo.address}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </body>
      </html>
    `;



    // Create PDF from HTML
    const { uri } = await Print.printToFileAsync({ html });

    // Share the PDF file
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${invoice.documentType?.toUpperCase()} #${invoice.invoiceNumber}`,
    });
  } catch (error) {
    Alert.alert('Error', 'Could not share invoice PDF');
  }
};

const styles = {
  container: {
    flex: 1,   
    backgroundColor: '#f3f4f6',
    marginTop: 0
  },
  header: {
    backgroundColor: '#1666c2ff',
    padding: 2,
    paddingTop: 15,
    position: 'relative',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10

  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginLeft: 12,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#ffffffff',
    marginLeft: 12,
  },
  exportBtn: {
    position: 'absolute',
    top: 40,
    right: 25,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 152, 3, 1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  

  },
  exportBtnText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 14,
  },
  searchSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  filterTabs: {
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterTab: {
    backgroundColor: '#32006bff',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: 'white',
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    fontWeight: '500',
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginRight: 6,
  },
  activeSortBtn: {
    backgroundColor: '#32006bff',
  },
  sortBtnText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeSortBtnText: {
    color: 'white',
  },
  sortOrderBtn: {
    padding: 6,
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
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
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 12,
  },
};