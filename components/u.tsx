// components/ManageCustomers.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, KeyboardAvoidingView, Platform, StatusBar, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from 'components/Styles/MainAppStyles';
import * as Contacts from 'expo-contacts';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// Customer interface
interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: number;
}

// Sale interface
interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  date: string;
  total: number;
  currency: string;
  documentType: string;
  items: Array<{
    description: string;
    quantity: string;
    price: string;
  }>;
}

// Contact interface for picker
interface ContactItem {
  id: string;
  name: string;
  phoneNumbers?: Array<{ number: string; label?: string }>;
  emails?: Array<{ email: string; label?: string }>;
}

interface ManageCustomersProps {
  showToast: (message: string, type?: string) => void;
  isDarkMode: boolean;
  formatCurrency: (amount: number) => string;
  onCustomersUpdate?: () => void; // Preferred callback name
  manageCustomersUpdate?: () => void; // Backward-compatible alias
}

const ManageCustomers: React.FC<ManageCustomersProps> = ({
  showToast,
  isDarkMode,
  formatCurrency,
  onCustomersUpdate // Add this parameter
}) => {
  // Get screen dimensions and calculate safe area manually
  const { height: screenHeight } = Dimensions.get('window');
  const statusBarHeight = Platform.OS === 'ios' ? (screenHeight >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<'customers' | 'sales'>('customers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [csvData, setCsvData] = useState<string>('');
  const [csvPreviewData, setCsvPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Form data with proper state management
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  useEffect(() => {
    loadCustomers();
    loadSalesHistory();
  }, []);

  const loadCustomers = async () => {
    try {
      const stored = await AsyncStorage.getItem('customers');
      if (stored) {
        setCustomers(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      showToast('Error loading customers', 'error');
    }
  };

  const loadSalesHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedInvoices');
      if (stored) {
        const invoices = JSON.parse(stored);
        const sales: Sale[] = invoices.map((invoice: any) => ({
          id: invoice.id,
          customerId: invoice.customerInfo?.id || '',
          customerName: invoice.customerInfo?.name || 'Unknown Customer',
          invoiceNumber: invoice.invoiceNumber,
          date: invoice.date,
          total: invoice.total || 0,
          currency: invoice.currency || 'GHC',
          documentType: invoice.documentType || 'invoice',
          items: invoice.items || []
        }));
        setSalesHistory(sales);
      }
    } catch (error) {
      console.error('Error loading sales history:', error);
      showToast('Error loading sales history', 'error');
    }
  };

  const saveCustomers = async (updatedCustomers: Customer[]) => {
    try {
      await AsyncStorage.setItem('customers', JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);

      // Notify parent component that customers were updated
      if (onCustomersUpdate) {
        onCustomersUpdate();
      }
    } catch (error) {
      console.error('Error saving customers:', error);
      showToast('Error saving customers', 'error');
    }
  };

  // Request contacts permission
  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  };

  // Load contacts
  const loadContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        showToast('Contacts permission is required to import contacts', 'error');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName,
      });

      const formattedContacts: ContactItem[] = data
        .filter(contact => contact.name)
        .map(contact => ({
          id: contact.id,
          name: contact.name,
          phoneNumbers: contact.phoneNumbers,
          emails: contact.emails
        }));

      setContacts(formattedContacts);
      setShowContactPicker(true);
    } catch (error) {
      console.error('Error loading contacts:', error);
      showToast('Error loading contacts', 'error');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Add customer from contact
  const addCustomerFromContact = (contact: ContactItem) => {
    const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0
      ? contact.phoneNumbers[0].number
      : '';
    const email = contact.emails && contact.emails.length > 0
      ? contact.emails[0].email
      : '';

    setFormData({
      name: contact.name,
      address: '',
      phone: phone,
      email: email
    });

    setShowContactPicker(false);
    setShowAddModal(true);
  };

  // Parse CSV data
  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data = [];

      // Check for required headers
      const requiredHeaders = ['name'];
      const hasRequiredHeaders = requiredHeaders.every(header =>
        headers.some(h => h.includes(header))
      );

      if (!hasRequiredHeaders) {
        throw new Error('CSV file must contain at least a "name" column');
      }

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length === headers.length && values.some(v => v)) {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Import customers from CSV
  const importFromCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const csvContent = await FileSystem.readAsStringAsync(fileUri);

        const parsedData = parseCSV(csvContent);
        setCsvData(csvContent);
        setCsvPreviewData(parsedData);
        setShowImportModal(true);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      showToast('Error reading CSV file. Please check the format.', 'error');
    }
  };

  // Process CSV import
  const processCsvImport = async () => {
    setIsImporting(true);
    try {
      const newCustomers: Customer[] = [];
      let importedCount = 0;
      let skippedCount = 0;

      for (const row of csvPreviewData) {
        const name = row.name || row.customer_name || row['customer name'] || '';
        if (!name.trim()) {
          skippedCount++;
          continue;
        }

        // Check if customer already exists
        const existingCustomer = customers.find(c =>
          c.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (existingCustomer) {
          skippedCount++;
          continue;
        }

        const newCustomer: Customer = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          address: row.address || row.location || '',
          phone: row.phone || row.telephone || row.mobile || row.contact || '',
          email: row.email || row.mail || row['email address'] || '',
          createdAt: Date.now()
        };

        newCustomers.push(newCustomer);
        importedCount++;
      }

      if (newCustomers.length > 0) {
        const updatedCustomers = [...customers, ...newCustomers];
        await saveCustomers(updatedCustomers);
      }

      setShowImportModal(false);
      setCsvData('');
      setCsvPreviewData([]);

      showToast(
        `Import completed! ${importedCount} customers imported, ${skippedCount} skipped.`,
        'success'
      );
    } catch (error) {
      console.error('Error processing CSV import:', error);
      showToast('Error importing customers from CSV', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const addCustomer = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter customer name', 'error');
      return;
    }

    // Check for duplicate names
    const existingCustomer = customers.find(c =>
      c.name.toLowerCase() === formData.name.trim().toLowerCase()
    );

    if (existingCustomer) {
      showToast('A customer with this name already exists', 'error');
      return;
    }

    const newCustomer: Customer = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      createdAt: Date.now()
    };

    const updatedCustomers = [...customers, newCustomer];
    await saveCustomers(updatedCustomers);

    resetForm();
    setShowAddModal(false);
    showToast('Customer added successfully', 'success');
  };

  const editCustomer = async () => {
    if (!formData.name.trim() || !selectedCustomer) {
      showToast('Please enter customer name', 'error');
      return;
    }

    // Check for duplicate names (excluding current customer)
    const existingCustomer = customers.find(c =>
      c.id !== selectedCustomer.id &&
      c.name.toLowerCase() === formData.name.trim().toLowerCase()
    );

    if (existingCustomer) {
      showToast('A customer with this name already exists', 'error');
      return;
    }

    const updatedCustomer: Customer = {
      ...selectedCustomer,
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    };

    const updatedCustomers = customers.map(customer =>
      customer.id === selectedCustomer.id ? updatedCustomer : customer
    );

    await saveCustomers(updatedCustomers);

    resetForm();
    setShowEditModal(false);
    setSelectedCustomer(null);
    showToast('Customer updated successfully', 'success');
  };

  const deleteCustomer = async (customerId: string) => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedCustomers = customers.filter(customer => customer.id !== customerId);
            await saveCustomers(updatedCustomers);
            showToast('Customer deleted successfully', 'success');
          }
        }
      ]
    );
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      address: customer.address,
      phone: customer.phone,
      email: customer.email
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: ''
    });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const filteredSales = salesHistory.filter(sale =>
    sale.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearchQuery.toLowerCase())
  );

  const getCustomerSales = (customerId: string) => {
    return salesHistory.filter(sale => sale.customerId === customerId);
  };

  const getTotalSalesForCustomer = (customerId: string) => {
    return getCustomerSales(customerId).reduce((total, sale) => total + sale.total, 0);
  };

  // Customer Modal Component
  const CustomerModal = ({ visible, onClose, onSave, title }: {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    title: string;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
      }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={[
            currentStyles.section,
            {
              margin: 0,
              marginTop: 50,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              backgroundColor: isDarkMode ? '#374151' : 'white',
              maxHeight: '90%',
              minHeight: '60%'
            }
          ]}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb'
            }}>
              <Text style={[currentStyles.sectionTitleText, { fontSize: 20 }]}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1 }}
            >
              <View style={{ paddingBottom: 20 }}>
                <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                  Customer Name *
                </Text>
                <TextInput
                  style={currentStyles.input}
                  placeholder="Enter customer name"
                  placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  autoCapitalize="words"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />

                <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                  Address
                </Text>
                <TextInput
                  style={[currentStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Enter address"
                  placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  multiline
                  numberOfLines={3}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />

                <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                  Phone
                </Text>
                <TextInput
                  style={currentStyles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />

                <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                  Email
                </Text>
                <TextInput
                  style={currentStyles.input}
                  placeholder="Enter email address"
                  placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>
            </ScrollView>

            <View style={{
              flexDirection: 'row',
              paddingTop: 20,
              gap: 12,
              borderTopWidth: 1,
              borderTopColor: isDarkMode ? '#4b5563' : '#e5e7eb'
            }}>
              <TouchableOpacity
                style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#6b7280' }]}
                onPress={onClose}
              >
                <Text style={currentStyles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#2563eb' }]}
                onPress={onSave}
              >
                <Text style={currentStyles.actionButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  // Contact Picker Modal
  const ContactPickerModal = () => (
    <Modal
      visible={showContactPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowContactPicker(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
      }}>
        <View style={[
          currentStyles.section,
          {
            margin: 0,
            marginTop: 50,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            backgroundColor: isDarkMode ? '#374151' : 'white',
            height: '85%'
          }
        ]}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb'
          }}>
            <Text style={[currentStyles.sectionTitleText, { fontSize: 20 }]}>Select Contact</Text>
            <TouchableOpacity onPress={() => setShowContactPicker(false)}>
              <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
          </View>

          {/* Contact Search */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16
          }}>
            <Feather name="search" size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 16,
                color: isDarkMode ? '#f3f4f6' : '#1f2937'
              }}
              placeholder="Search contacts..."
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={contactSearchQuery}
              onChangeText={setContactSearchQuery}
            />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredContacts.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Feather name="users" size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
                <Text style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}>
                  No contacts found
                </Text>
              </View>
            ) : (
              filteredContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb'
                  }}
                  onPress={() => addCustomerFromContact(contact)}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#2563eb',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                      {contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      marginBottom: 4
                    }}>
                      {contact.name}
                    </Text>

                    {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                      <Text style={{
                        fontSize: 14,
                        color: isDarkMode ? '#9ca3af' : '#6b7280'
                      }}>
                        {contact.phoneNumbers[0].number}
                      </Text>
                    )}

                    {contact.emails && contact.emails.length > 0 && (
                      <Text style={{
                        fontSize: 14,
                        color: isDarkMode ? '#9ca3af' : '#6b7280'
                      }}>
                        {contact.emails[0].email}
                      </Text>
                    )}
                  </View>

                  <Feather name="chevron-right" size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // CSV Import Modal
  const CsvImportModal = () => (
    <Modal
      visible={showImportModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowImportModal(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
      }}>
        <View style={[
          currentStyles.section,
          {
            margin: 0,
            marginTop: 50,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            backgroundColor: isDarkMode ? '#374151' : 'white',
            height: '85%'
          }
        ]}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb'
          }}>
            <Text style={[currentStyles.sectionTitleText, { fontSize: 20 }]}>Import Customers</Text>
            <TouchableOpacity onPress={() => setShowImportModal(false)}>
              <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
          </View>

          <Text style={{
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            marginBottom: 16,
            lineHeight: 20
          }}>
            Preview of customers to be imported. Existing customers with the same name will be skipped.
          </Text>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {csvPreviewData.map((row, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: isDarkMode ? '#4b5563' : '#f9fafb',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 12
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                  marginBottom: 8
                }}>
                  {row.name || row.customer_name || row['customer name'] || 'No Name'}
                </Text>

                {(row.phone || row.telephone || row.mobile || row.contact) && (
                  <Text style={{
                    fontSize: 14,
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    marginBottom: 4
                  }}>
                    📞 {row.phone || row.telephone || row.mobile || row.contact}
                  </Text>
                )}

                {(row.email || row.mail || row['email address']) && (
                  <Text style={{
                    fontSize: 14,
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    marginBottom: 4
                  }}>
                    ✉️ {row.email || row.mail || row['email address']}
                  </Text>
                )}

                {(row.address || row.location) && (
                  <Text style={{
                    fontSize: 14,
                    color: isDarkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    📍 {row.address || row.location}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={{
            flexDirection: 'row',
            paddingTop: 20,
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? '#4b5563' : '#e5e7eb'
          }}>
            <TouchableOpacity
              style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#6b7280' }]}
              onPress={() => setShowImportModal(false)}
              disabled={isImporting}
            >
              <Text style={currentStyles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                currentStyles.actionButton,
                {
                  flex: 1,
                  backgroundColor: isImporting ? '#9ca3af' : '#16a34a',
                  opacity: isImporting ? 0.7 : 1
                }
              ]}
              onPress={processCsvImport}
              disabled={isImporting}
            >
              <Text style={currentStyles.actionButtonText}>
                {isImporting ? 'Importing...' : `Import ${csvPreviewData.length} Customers`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>
      {/* Status Bar */}
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#1f2937' : '#f3f4f6'} 
      />

      {/* Header with Safe Area */}
      <View style={[
        currentStyles.header, 
        { 
          paddingTop: statusBarHeight + 10,
          marginTop: 0
        }
      ]}>
        <View style={currentStyles.headerTitle}>
          <Feather
            name="users"
            size={28}
            color="white"
            style={{
              marginRight: 6,
              marginLeft: 10,
              alignSelf: 'center',
              opacity: 0.9,
            }}
          />
          <Text style={currentStyles.headerText}>Manage Customers</Text>
        </View>
        <Text style={currentStyles.headerSubtext}>Manage your customers and view sales history</Text>
      </View>

      {/* Tab Navigation */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: isDarkMode ? '#374151' : 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        padding: 4
      }}>
        {[
          { id: 'customers', label: 'Customers', icon: 'users' },
          { id: 'sales', label: 'Sales History', icon: 'trending-up' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 6,
              backgroundColor: activeTab === tab.id ? '#2563eb' : 'transparent'
            }}
            onPress={() => setActiveTab(tab.id as 'customers' | 'sales')}
          >
            <Feather
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? 'white' : (isDarkMode ? '#9ca3af' : '#6b7280')}
            />
            <Text style={{
              marginLeft: 8,
              color: activeTab === tab.id ? 'white' : (isDarkMode ? '#9ca3af' : '#6b7280'),
              fontWeight: '500'
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#374151' : 'white',
        margin: 16,
        padding: 12,
        borderRadius: 8
      }}>
        <Feather name="search" size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 12,
            fontSize: 16,
            color: isDarkMode ? '#f3f4f6' : '#1f2937'
          }}
          placeholder={activeTab === 'customers' ? 'Search customers...' : 'Search sales...'}
          placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'customers' ? (
          <>
            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
              <TouchableOpacity
                style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#059669' }]}
                onPress={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <Feather name="plus" size={16} color="white" />
                <Text style={[currentStyles.actionButtonText, { marginLeft: 8 }]}>Add Customer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[currentStyles.actionButton, { backgroundColor: '#7c3aed' }]}
                onPress={loadContacts}
                disabled={isLoadingContacts}
              >
                <Feather name={isLoadingContacts ? "loader" : "user-plus"} size={16} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[currentStyles.actionButton, { backgroundColor: '#ea580c' }]}
                onPress={importFromCSV}
              >
                <Feather name="upload" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Customers List */}
            {filteredCustomers.length === 0 ? (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                backgroundColor: isDarkMode ? '#374151' : 'white',
                borderRadius: 8
              }}>
                <Feather name="users" size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
                <Text style={{
                  marginTop: 16,
                  fontSize: 18,
                  fontWeight: '500',
                  color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}>
                  {searchQuery ? 'No customers found' : 'No customers yet'}
                </Text>
                <Text style={{
                  marginTop: 8,
                  color: isDarkMode ? '#6b7280' : '#9ca3af',
                  textAlign: 'center'
                }}>
                  {searchQuery ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
                </Text>
              </View>
            ) : (
              filteredCustomers.map((customer) => {
                const customerSales = getCustomerSales(customer.id);
                const totalSales = getTotalSalesForCustomer(customer.id);

                return (
                  <View
                    key={customer.id}
                    style={{
                      backgroundColor: isDarkMode ? '#374151' : 'white',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 18,
                          fontWeight: '600',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937',
                          marginBottom: 4
                        }}>
                          {customer.name}
                        </Text>

                        {customer.email && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <Feather name="mail" size={14} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                            <Text style={{
                              marginLeft: 6,
                              color: isDarkMode ? '#9ca3af' : '#6b7280'
                            }}>
                              {customer.email}
                            </Text>
                          </View>
                        )}

                        {customer.phone && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <Feather name="phone" size={14} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                            <Text style={{
                              marginLeft: 6,
                              color: isDarkMode ? '#9ca3af' : '#6b7280'
                            }}>
                              {customer.phone}
                            </Text>
                          </View>
                        )}

                        {customer.address && (
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 }}>
                            <Feather name="map-pin" size={14} color={isDarkMode ? '#9ca3af' : '#6b7280'} style={{ marginTop: 2 }} />
                            <Text style={{
                              marginLeft: 6,
                              color: isDarkMode ? '#9ca3af' : '#6b7280',
                              flex: 1
                            }}>
                              {customer.address}
                            </Text>
                          </View>
                        )}

                        {/* Sales Summary */}
                        <View style={{
                          flexDirection: 'row',
                          marginTop: 12,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: isDarkMode ? '#4b5563' : '#e5e7eb'
                        }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 12,
                              color: isDarkMode ? '#9ca3af' : '#6b7280'
                            }}>
                              Total Sales
                            </Text>
                            <Text style={{
                              fontSize: 16,
                              fontWeight: '600',
                              color: '#059669'
                            }}>
                              {formatCurrency(totalSales)}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 12,
                              color: isDarkMode ? '#9ca3af' : '#6b7280'
                            }}>
                              Invoices
                            </Text>
                            <Text style={{
                              fontSize: 16,
                              fontWeight: '600',
                              color: isDarkMode ? '#f3f4f6' : '#1f2937'
                            }}>
                              {customerSales.length}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                        <TouchableOpacity
                          style={{
                            padding: 8,
                            borderRadius: 6,
                            backgroundColor: '#2563eb',
                            marginRight: 8
                          }}
                          onPress={() => openEditModal(customer)}
                        >
                          <Feather name="edit-2" size={16} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            padding: 8,
                            borderRadius: 6,
                            backgroundColor: '#ef4444'
                          }}
                          onPress={() => deleteCustomer(customer.id)}
                        >
                          <Feather name="trash-2" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          // Sales History Tab
          <>
            {filteredSales.length === 0 ? (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                backgroundColor: isDarkMode ? '#374151' : 'white',
                borderRadius: 8
              }}>
                <Feather name="trending-up" size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
                <Text style={{
                  marginTop: 16,
                  fontSize: 18,
                  fontWeight: '500',
                  color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}>
                  {searchQuery ? 'No sales found' : 'No sales yet'}
                </Text>
                <Text style={{
                  marginTop: 8,
                  color: isDarkMode ? '#6b7280' : '#9ca3af',
                  textAlign: 'center'
                }}>
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first invoice to see sales history'}
                </Text>
              </View>
            ) : (
              filteredSales.map((sale) => (
                <View
                  key={sale.id}
                  style={{
                    backgroundColor: isDarkMode ? '#374151' : 'white',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        marginBottom: 4
                      }}>
                        {sale.invoiceNumber}
                      </Text>

                      <Text style={{
                        fontSize: 14,
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        marginBottom: 2
                      }}>
                        Customer: {sale.customerName}
                      </Text>

                      <Text style={{
                        fontSize: 14,
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        marginBottom: 8
                      }}>
                        Date: {sale.date}
                      </Text>

                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: sale.documentType === 'invoice' ? '#dbeafe' : '#fef3c7',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        alignSelf: 'flex-start'
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: sale.documentType === 'invoice' ? '#1e40af' : '#92400e',
                          textTransform: 'capitalize'
                        }}>
                          {sale.documentType}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: '#059669'
                      }}>
                        {formatCurrency(sale.total)}
                      </Text>

                      <Text style={{
                        fontSize: 12,
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        marginTop: 4
                      }}>
                        {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <CustomerModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onSave={addCustomer}
        title="Add New Customer"
      />

      <CustomerModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setSelectedCustomer(null);
        }}
        onSave={editCustomer}
        title="Edit Customer"
      />

      <ContactPickerModal />
      <CsvImportModal />
    </View>
  );
};

export default ManageCustomers;