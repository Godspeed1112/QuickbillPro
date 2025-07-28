// components/MainApp.tsx
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useCallback } from 'react';
import { View,Text,TextInput,TouchableOpacity,ScrollView,Alert,Share,Linking,SafeAreaView,StatusBar} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { styles, darkStyles } from './Styles/MainAppStyles.js';
import { SavedInvoicesManager } from './savedInvoices';
import SettingsTab from './SettingsTab';
import { PrintPdf } from './printPdf';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen, { logout } from 'components/Login';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <SalesInvoiceApp />
  );
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
  const iconName = type === 'success' ? 'check' : 'alert-circle';

  return (
    <View style={{
      position: 'absolute',
      top: 50,
      right: 16,
      backgroundColor: bgColor,
      padding: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1000,
      maxWidth: 300
    }}>
      <Feather name={iconName} size={20} color="white" />
      <Text style={{ color: 'white', marginLeft: 8, flex: 1 }}>{message}</Text>
      <TouchableOpacity onPress={onClose}>
        <Feather name="x" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
};

// Currency list
const CURRENCIES = [
  { code: 'GHC', symbol: '₵', name: 'Ghana Cedi' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' }
];

// Default app settings
const DEFAULT_APP_SETTINGS = {
  currency: 'GHC',
  darkMode: false,
  autoSave: true,
  defaultTaxRate: '10',
  companyName: '',
  companyEmail: '',
  notifications: true,
  autoBackup: false
};

// Create Invoice Tab Component
const CreateInvoiceTab = ({
  currency,
  businessInfo,
  setBusinessInfo,
  customerInfo,
  setCustomerInfo,
  items,
  documentType,
  setDocumentType,
  invoiceNumber,
  date,
  setDate,
  notes,
  setNotes,
  taxRate,
  setTaxRate,
  addItem,
  removeItem,
  updateItem,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  formatCurrency,
  validateForm,
  handleSavePDF,
  handleShare,
  handlePreview,
  handlePrint,
  handleEmailWithAttachment,
  resetForm,
  businessLogo,
  setBusinessLogo,
  customerSignature,
  setCustomerSignature,
  openCameraForLogo,
  openSignaturePicker,
  handleSaveToCloud,
  isSaving,
  isDarkMode,
  appSettings
}) => {
  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  return (
    <ScrollView style={currentStyles.scrollContainer}>
      <View style={currentStyles.header}>
        <View style={currentStyles.headerTitle}>
          <Feather name="file-text" size={28} color="white" />
          <Text style={currentStyles.headerText}>Create {documentType === 'invoice' ? 'Invoice' : 'Receipt'}</Text>
        </View>
        <Text style={currentStyles.headerSubtext}>Generate professional invoices and receipts</Text>
      </View>

      {/* Document Type */}
      <View style={currentStyles.section}>
        <Text style={currentStyles.sectionTitleText}>Document Type</Text>
        <View style={currentStyles.row}>
          {['invoice', 'receipt'].map(type => (
            <TouchableOpacity
              key={type}
              style={currentStyles.radioButton}
              onPress={() => setDocumentType(type)}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: documentType === type ? '#2563eb' : '#d1d5db',
                backgroundColor: documentType === type ? '#2563eb' : 'transparent',
              }} />
              <Text style={currentStyles.radioText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Document Info */}
      <View style={currentStyles.section}>
        <Text style={currentStyles.sectionTitleText}>Document Information</Text>
        <View style={currentStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Number:</Text>
            <TextInput
              style={currentStyles.input}
              value={invoiceNumber}
              editable={false}
              placeholder="Auto-generated"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Date:</Text>
            <TextInput
              style={currentStyles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>
        <View style={currentStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Tax Rate (%):</Text>
            <TextInput
              style={currentStyles.input}
              value={taxRate}
              onChangeText={setTaxRate}
              keyboardType="numeric"
              placeholder={appSettings.defaultTaxRate || "10"}
            />
          </View>
        </View>
      </View>

      {/* Business Info */}
      <View style={currentStyles.section}>
        <View style={currentStyles.sectionTitle}>
          <FontAwesome name="building" size={20} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
          <Text style={currentStyles.sectionTitleText}>Business Information</Text>
        </View>
        
        {/* Business Logo Section */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Business Logo:</Text>
          {businessLogo ? (
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#059669', marginBottom: 8 }}>✓ Logo captured</Text>
              <TouchableOpacity
                style={[currentStyles.actionButton, { backgroundColor: '#6b7280', width: 'auto', paddingHorizontal: 16 }]}
                onPress={openCameraForLogo}
              >
                <Feather name="camera" size={16} color="white" />
                <Text style={currentStyles.actionButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[currentStyles.actionButton, { backgroundColor: '#059669', marginBottom: 12 }]}
              onPress={openCameraForLogo}
            >
              <Feather name="camera" size={16} color="white" />
              <Text style={currentStyles.actionButtonText}>Add Business Logo</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={currentStyles.input}
          placeholder="Business Name"
          value={businessInfo.name}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, name: text })}
        />
        <TextInput
          style={currentStyles.input}
          placeholder="Address"
          value={businessInfo.address}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, address: text })}
        />
        <TextInput
          style={currentStyles.input}
          placeholder="Phone"
          value={businessInfo.phone}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, phone: text })}
        />
        <TextInput
          style={currentStyles.input}
          placeholder="Email"
          value={businessInfo.email}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, email: text })}
          keyboardType="email-address"
        />
        <TextInput
          style={currentStyles.input}
          placeholder="Tax ID (Optional)"
          value={businessInfo.taxId}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, taxId: text })}
        />
      </View>

      {/* Customer Info */}
      <View style={currentStyles.section}>
        <View style={currentStyles.sectionTitle}>
          <Feather name="user" size={20} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
          <Text style={currentStyles.sectionTitleText}>Customer Information</Text>
        </View>
        
        {/* Customer Signature Section */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Customer Signature:</Text>
          {customerSignature ? (
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#059669', marginBottom: 8 }}>✓ Signature captured</Text>
              <TouchableOpacity
                style={[currentStyles.actionButton, { backgroundColor: '#6b7280', width: 'auto', paddingHorizontal: 16 }]}
                onPress={openSignaturePicker}
              >
                <Feather name="edit" size={16} color="white" />
                <Text style={currentStyles.actionButtonText}>Retake Signature</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[currentStyles.actionButton, { backgroundColor: '#7c3aed', marginBottom: 12 }]}
              onPress={openSignaturePicker}
            >
              <Feather name="edit" size={16} color="white" />
              <Text style={currentStyles.actionButtonText}>Add Customer Signature</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={currentStyles.input}
          placeholder="Customer Name"
          value={customerInfo.name}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
        />
        <TextInput
          style={currentStyles.input}
          placeholder="Address"
          value={customerInfo.address}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, address: text })}
        />
        <TextInput
          style={currentStyles.input}
          placeholder="Phone"
          placeholderTextColor="#888"
          value={customerInfo.phone}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
        />
        <TextInput
          style={currentStyles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={customerInfo.email}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, email: text })}
          keyboardType="email-address"
        />
      </View>

      {/* Items */}
      <View style={currentStyles.section}>
        <Text style={currentStyles.sectionTitleText}>Items</Text>
        
        {items.map(item => (
          <View key={item.id} style={currentStyles.itemRow}>
            <TextInput
              style={currentStyles.itemDescription}
              placeholder="Item description"
              value={item.description}
              onChangeText={(text) => updateItem(item.id, 'description', text)}
            />
            <TextInput
              style={currentStyles.itemQuantity}
              placeholder="Qty"
              value={item.quantity}
              onChangeText={(text) => updateItem(item.id, 'quantity', text)}
              keyboardType="numeric"
            />
            <TextInput
              style={currentStyles.itemPrice}
              placeholder="Price"
              value={item.price}
              onChangeText={(text) => updateItem(item.id, 'price', text)}
              keyboardType="numeric"
            />
            <Text style={currentStyles.itemTotal}>
              {formatCurrency(parseFloat(item.quantity || 0) * parseFloat(item.price || 0))}
            </Text>
            <TouchableOpacity onPress={() => removeItem(item.id)}>
              <Feather name="minus-circle" size={18} color="red" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={currentStyles.addButton} onPress={addItem}>
          <Feather name="plus-circle" size={16} color="white" />
          <Text style={currentStyles.addButtonText}>Add Item</Text>
        </TouchableOpacity>

        {/* Totals */}
        <View style={currentStyles.totalsContainer}>
          <View style={currentStyles.totalRow}>
            <Text style={currentStyles.totalText}>Subtotal:</Text>
            <Text style={currentStyles.totalAmount}>{formatCurrency(calculateSubtotal())}</Text>
          </View>
          <View style={currentStyles.totalRow}>
            <Text style={currentStyles.totalText}>Tax ({taxRate}%):</Text>
            <Text style={currentStyles.totalAmount}>{formatCurrency(calculateTax())}</Text>
          </View>
          <View style={[currentStyles.totalRow, currentStyles.grandTotal]}>
            <Text style={[currentStyles.totalText, { fontWeight: 'bold', fontSize: 18 }]}>Total:</Text>
            <Text style={[currentStyles.totalAmount, { fontWeight: 'bold', fontSize: 18 }]}>
              {formatCurrency(calculateTotal())}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      <View style={currentStyles.section}>
        <Text style={[currentStyles.sectionTitleText, { marginBottom: 12 }]}>Notes</Text>
        <TextInput
          style={currentStyles.textarea}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes or terms..."
        />
      </View>

      {/* Actions */}
      <View style={currentStyles.actionsContainer}>
        {[
          { label: 'Share', icon: 'share', onClick: handleShare, color: '#059669' },
          { label: 'Preview', icon: 'eye', onClick: handlePreview, color: '#2563eb' },
          { label: 'Print', icon: 'printer', onClick: handlePrint, color: '#7c3aed' },
          { label: 'Save', icon: 'download', onClick: handleSavePDF, color: '#ea580c' },
          { label: 'Email', icon: 'mail', onClick: handleEmailWithAttachment, color: '#4338ca' }
        ].map((btn, i) => (
          <TouchableOpacity
            key={i}
            style={[currentStyles.actionButton, { backgroundColor: btn.color }]}
            onPress={() => validateForm() && btn.onClick()}
          >
            <Feather name={btn.icon} size={16} color="white" />
            <Text style={currentStyles.actionButtonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cloud Save Button */}
      <TouchableOpacity
        style={[currentStyles.actionButton, { 
          backgroundColor: isSaving ? '#6b7280' : '#10b981',
          marginBottom: 16,
          opacity: isSaving ? 0.7 : 1
        }]}
        onPress={handleSaveToCloud}
        disabled={isSaving}
      >
        <Feather name={isSaving ? "loader" : "cloud"} size={16} color="white" />
        <Text style={currentStyles.actionButtonText}>
          {isSaving ? 'Saving...' : 'Save to Cloud'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={currentStyles.resetButton} onPress={resetForm}>
        <Text style={currentStyles.resetButtonText}>Reset Form & Generate New Number</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Saved Invoices Tab Component
const SavedInvoicesTab = ({ showToast, onPrintInvoice, isDarkMode }) => {
  return (
    <SavedInvoicesManager 
      showToast={showToast} 
      onPrintInvoice={onPrintInvoice}
      isDarkMode={isDarkMode}
    />
  );
};

// Main App Component
const SalesInvoiceApp = () => {
  const [toast, setToast] = useState(null);
  const [currentTab, setCurrentTab] = useState('create');
  
  // App settings state
  const [appSettings, setAppSettings] = useState(DEFAULT_APP_SETTINGS);

  // Business and customer info
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxId: ''
  });
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  // Document data
  const [items, setItems] = useState([{ id: 1, description: '', quantity: '1', price: '0' }]);
  const [documentType, setDocumentType] = useState('invoice');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState('10');
  const [invoiceCounter, setInvoiceCounter] = useState(1);
  const [receiptCounter, setReceiptCounter] = useState(1);

  // Camera and images
  const [businessLogo, setBusinessLogo] = useState(null);
  const [customerSignature, setCustomerSignature] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Print PDF state
  const [showPrintPdf, setShowPrintPdf] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  const showToast = (msg, type = 'info') => setToast({ message: msg, type });

  // Load app settings on startup
  useEffect(() => {
    loadAppSettings();
  }, []);

  // Update tax rate when default changes
  useEffect(() => {
    if (appSettings.defaultTaxRate && appSettings.defaultTaxRate !== taxRate) {
      setTaxRate(appSettings.defaultTaxRate);
    }
  }, [appSettings.defaultTaxRate]);

  // Update business info from settings
  useEffect(() => {
    if (appSettings.companyName && appSettings.companyName !== businessInfo.name) {
      setBusinessInfo(prev => ({
        ...prev,
        name: appSettings.companyName,
        email: appSettings.companyEmail || prev.email
      }));
    }
  }, [appSettings.companyName, appSettings.companyEmail]);

  const loadAppSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('@app_settings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setAppSettings({ ...DEFAULT_APP_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
      showToast('Error loading settings', 'error');
    }
  };

  // Settings update handlers
  const handleSettingsUpdate = useCallback((newSettings) => {
    setAppSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleCurrencyChange = useCallback((newCurrency) => {
    setAppSettings(prev => ({ ...prev, currency: newCurrency }));
  }, []);

  useEffect(() => {
    generateDocumentNumber();
  }, [documentType]);

  const generateDocumentNumber = () => {
    const current = documentType === 'invoice' ? invoiceCounter : receiptCounter;
    const next = current + 1;
    const pref = documentType === 'invoice' ? 'INV' : 'RCT';
    const num = `${pref}-${String(next).padStart(4, '0')}`;
    setInvoiceNumber(num);
    
    if (documentType === 'invoice') {
      setInvoiceCounter(next);
    } else {
      setReceiptCounter(next);
    }
  };

  // Image picker functions
  const openCameraForLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to add images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setBusinessLogo(result.assets[0].uri);
        showToast('Business logo added!', 'success');
      }
    } catch (error) {
      showToast('Error picking image', 'error');
    }
  };

  const openSignaturePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to add images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setCustomerSignature(result.assets[0].uri);
        showToast('Customer signature added!', 'success');
      }
    } catch (error) {
      showToast('Error picking image', 'error');
    }
  };

  const handleSaveToCloud = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const invoiceData = {
        documentType,
        invoiceNumber,
        date,
        businessInfo,
        customerInfo,
        items,
        taxRate,
        notes,
        currency: appSettings.currency,
        businessLogo,
        customerSignature,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        status: 'draft',
        createdAt: Date.now()
      };
      
      // Auto-save functionality
      if (appSettings.autoSave) {
        await AsyncStorage.setItem(`@draft_${Date.now()}`, JSON.stringify(invoiceData));
      }
      
      console.log('Saving to cloud:', invoiceData);
      showToast('Saved to cloud!', 'success');
    } catch (error) {
      showToast('Failed to save: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Item management
  const addItem = () => {
    setItems(prevItems => [
      ...prevItems,
      { id: Date.now(), description: '', quantity: '1', price: '0' }
    ]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const rate = parseFloat(taxRate) || 0;
    return (subtotal * rate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatCurrency = (amount) => {
    const currencyObj = CURRENCIES.find(c => c.code === appSettings.currency);
    return `${currencyObj?.symbol || ''}${amount.toFixed(2)}`;
  };

  const validateForm = () => {
    if (!businessInfo.name.trim()) {
      showToast('Please enter business name', 'error');
      return false;
    }
    if (!customerInfo.name.trim()) {
      showToast('Please enter customer name', 'error');
      return false;
    }
    if (items.length === 0 || !items.some(item => item.description.trim())) {
      showToast('Please add at least one item', 'error');
      return false;
    }
    return true;
  };

  const handleSavePDF = async () => {
    if (!validateForm()) return;
    showToast('Document saved successfully', 'success');
  };

  const generateDocumentText = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();

    return `${documentType.toUpperCase()} - ${invoiceNumber}
Date: ${date}

From:
${businessInfo.name}
${businessInfo.address}
Phone: ${businessInfo.phone}
Email: ${businessInfo.email}
${businessInfo.taxId ? `Tax ID: ${businessInfo.taxId}` : ''}

To:
${customerInfo.name}
${customerInfo.address}
Phone: ${customerInfo.phone}
Email: ${customerInfo.email}

Items:
${items.map(item => `${item.description} - Qty: ${item.quantity} × ${formatCurrency(parseFloat(item.price))} = ${formatCurrency(parseFloat(item.quantity) * parseFloat(item.price))}`).join('\n')}

Subtotal: ${formatCurrency(subtotal)}
Tax (${taxRate}%): ${formatCurrency(tax)}
Total: ${formatCurrency(total)}

${notes ? `Notes: ${notes}` : ''}`.trim();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${documentType} ${invoiceNumber}`,
        message: generateDocumentText()
      });
    } catch (error) {
      showToast('Error sharing document', 'error');
    }
  };

  const handlePreview = () => {
    Alert.alert(`${documentType.toUpperCase()} Preview`, generateDocumentText());
  };

  const handlePrint = () => {
    if (!validateForm()) return;
    
    const invoiceData = {
      id: Date.now().toString(),
      documentType,
      invoiceNumber,
      date,
      businessInfo,
      customerInfo,
      items,
      taxRate,
      notes,
      currency: appSettings.currency,
      businessLogo,
      customerSignature,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      formatCurrency,
      createdAt: Date.now()
    };
    
    setInvoiceToPrint(invoiceData);
    setShowPrintPdf(true);
  };

  const handlePrintFromSaved = (invoiceData) => {
    setInvoiceToPrint(invoiceData);
    setShowPrintPdf(true);
  };

  const handleEmailWithAttachment = () => {
    const subject = `${documentType} ${invoiceNumber}`;
    const body = generateDocumentText();
    const mailtoLink = `mailto:${customerInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoLink).catch(() => {
      showToast('Could not open email app', 'error');
    });
  };

  const resetForm = () => {
    setBusinessInfo({ 
      name: appSettings.companyName || '', 
      address: '', 
      phone: '', 
      email: appSettings.companyEmail || '', 
      taxId: '' 
    });
    setCustomerInfo({ name: '', address: '', phone: '', email: '' });
    setItems([{ id: Date.now(), description: '', quantity: '1', price: '0' }]);
    setNotes('');
    setTaxRate(appSettings.defaultTaxRate || '10');
    setBusinessLogo(null);
    setCustomerSignature(null);
    generateDocumentNumber();
    showToast('Form reset successfully', 'success');
  };

  const tabs = [
    { id: 'create', label: 'Create', icon: 'plus-circle' },
    { id: 'saved', label: 'Saved', icon: 'folder' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const renderContent = () => {
    const currentStyles = appSettings.darkMode ? { ...styles, ...darkStyles } : styles;
    
    switch (currentTab) {
      case 'create':
        return (
          <CreateInvoiceTab
            currency={appSettings.currency}
            businessInfo={businessInfo}
            setBusinessInfo={setBusinessInfo}
            customerInfo={customerInfo}
            setCustomerInfo={setCustomerInfo}
            items={items}
            documentType={documentType}
            setDocumentType={setDocumentType}
            invoiceNumber={invoiceNumber}
            date={date}
            setDate={setDate}
            notes={notes}
            setNotes={setNotes}
            taxRate={taxRate}
            setTaxRate={setTaxRate}
            addItem={addItem}
            removeItem={removeItem}
            updateItem={updateItem}
            calculateSubtotal={calculateSubtotal}
            calculateTax={calculateTax}
            calculateTotal={calculateTotal}
            formatCurrency={formatCurrency}
            validateForm={validateForm}
            handleSavePDF={handleSavePDF}
            handleShare={handleShare}
            handlePreview={handlePreview}
            handlePrint={handlePrint}
            handleEmailWithAttachment={handleEmailWithAttachment}
            resetForm={resetForm}
            businessLogo={businessLogo}
            setBusinessLogo={setBusinessLogo}
            customerSignature={customerSignature}
            setCustomerSignature={setCustomerSignature}
            openCameraForLogo={openCameraForLogo}
            openSignaturePicker={openSignaturePicker}
            handleSaveToCloud={handleSaveToCloud}
            isSaving={isSaving}
            isDarkMode={appSettings.darkMode}
            appSettings={appSettings}
          />
        );
      case 'saved':
        return (
          <SavedInvoicesTab 
            showToast={showToast} 
            onPrintInvoice={handlePrintFromSaved}
            isDarkMode={appSettings.darkMode}
          />
        );
      case 'settings':
        return (
          <SettingsTab 
            currency={appSettings.currency} 
            setCurrency={handleCurrencyChange} 
            showToast={showToast}
            appSettings={appSettings}
            onSettingsUpdate={handleSettingsUpdate}
          />
        );
      default:
        return null;
    }
  };

  const currentStyles = appSettings.darkMode ? { ...styles, ...darkStyles } : styles;

  return (
    <SafeAreaView style={[currentStyles.container, { backgroundColor: appSettings.darkMode ? '#1f2937' : '#f3f4f6' }]}>
      <StatusBar 
        barStyle={appSettings.darkMode ? "light-content" : "dark-content"} 
        backgroundColor={appSettings.darkMode ? "#111827" : "#1e40af"} 
      />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={[currentStyles.bottomTabBar, { backgroundColor: appSettings.darkMode ? '#374151' : 'white' }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={currentStyles.bottomTab}
            onPress={() => setCurrentTab(tab.id)}
          >
            <Feather
              name={tab.icon}
              size={24}
              color={currentTab === tab.id ? '#2563eb' : (appSettings.darkMode ? '#9ca3af' : '#6b7280')}
            />
            <Text
              style={[
                currentStyles.bottomTabText,
                currentTab === tab.id && currentStyles.activeBottomTabText,
                { color: appSettings.darkMode ? '#f3f4f6' : '#1f2937' }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Print PDF Modal */}
      {showPrintPdf && invoiceToPrint && (
        <PrintPdf
          visible={showPrintPdf}
          onClose={() => {
            setShowPrintPdf(false);
            setInvoiceToPrint(null);
          }}
          invoiceData={invoiceToPrint}
          showToast={showToast}
          isDarkMode={appSettings.darkMode}
        />
      )}
    </SafeAreaView>
  );
};

export default SalesInvoiceApp;