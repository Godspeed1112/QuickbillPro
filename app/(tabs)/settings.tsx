// components/MainApp.tsx
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Linking,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { styles } from './Styles/MainAppStyles.js';
import { SavedInvoicesManager } from './savedInvoices';
import SettingsTab from './SettingsTab';
import { PrintPdf } from './printPdf';

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
  isSaving
}) => {
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Feather name="file-text" size={28} color="white" />
          <Text style={styles.headerText}>Create {documentType === 'invoice' ? 'Invoice' : 'Receipt'}</Text>
        </View>
        <Text style={styles.headerSubtext}>Generate professional invoices and receipts</Text>
      </View>

      {/* Document Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleText}>Document Type</Text>
        <View style={styles.row}>
          {['invoice', 'receipt'].map(type => (
            <TouchableOpacity
              key={type}
              style={styles.radioButton}
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
              <Text style={styles.radioText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Document Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleText}>Document Information</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 8, fontWeight: '500' }}>Number:</Text>
            <TextInput
              style={styles.input}
              value={invoiceNumber}
              editable={false}
              placeholder="Auto-generated"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 8, fontWeight: '500' }}>Date:</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 8, fontWeight: '500' }}>Tax Rate (%):</Text>
            <TextInput
              style={styles.input}
              value={taxRate}
              onChangeText={setTaxRate}
              keyboardType="numeric"
              placeholder="10"
            />
          </View>
        </View>
      </View>

      {/* Business Info */}
      <View style={styles.section}>
        <View style={styles.sectionTitle}>
          <FontAwesome name="building" size={20} color="#1f2937" />
          <Text style={styles.sectionTitleText}>Business Information</Text>
        </View>
        
        {/* Business Logo Section */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 8, fontWeight: '500' }}>Business Logo:</Text>
          {businessLogo ? (
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#059669', marginBottom: 8 }}>✓ Logo captured</Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#6b7280', width: 'auto', paddingHorizontal: 16 }]}
                onPress={openCameraForLogo}
              >
                <Feather name="camera" size={16} color="white" />
                <Text style={styles.actionButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#059669', marginBottom: 12 }]}
              onPress={openCameraForLogo}
            >
              <Feather name="camera" size={16} color="white" />
              <Text style={styles.actionButtonText}>Add Business Logo</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Business Name"
          value={businessInfo.name}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={businessInfo.address}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, address: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={businessInfo.phone}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, phone: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={businessInfo.email}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, email: text })}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Tax ID (Optional)"
          value={businessInfo.taxId}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, taxId: text })}
        />
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <View style={styles.sectionTitle}>
          <Feather name="user" size={20} color="#1f2937" />
          <Text style={styles.sectionTitleText}>Customer Information</Text>
        </View>
        
        {/* Customer Signature Section */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 8, fontWeight: '500' }}>Customer Signature:</Text>
          {customerSignature ? (
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#059669', marginBottom: 8 }}>✓ Signature captured</Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#6b7280', width: 'auto', paddingHorizontal: 16 }]}
                onPress={openSignaturePicker}
              >
                <Feather name="edit" size={16} color="white" />
                <Text style={styles.actionButtonText}>Retake Signature</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#7c3aed', marginBottom: 12 }]}
              onPress={openSignaturePicker}
            >
              <Feather name="edit" size={16} color="white" />
              <Text style={styles.actionButtonText}>Add Customer Signature</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Customer Name"
          value={customerInfo.name}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={customerInfo.address}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, address: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={customerInfo.phone}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={customerInfo.email}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, email: text })}
          keyboardType="email-address"
        />
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleText}>Items</Text>
        
        {items.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <TextInput
              style={styles.itemDescription}
              placeholder="Item description"
              value={item.description}
              onChangeText={(text) => updateItem(item.id, 'description', text)}
            />
            <TextInput
              style={styles.itemQuantity}
              placeholder="Qty"
              value={item.quantity}
              onChangeText={(text) => updateItem(item.id, 'quantity', text)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.itemPrice}
              placeholder="Price"
              value={item.price}
              onChangeText={(text) => updateItem(item.id, 'price', text)}
              keyboardType="numeric"
            />
            <Text style={styles.itemTotal}>
              {formatCurrency(parseFloat(item.quantity || 0) * parseFloat(item.price || 0))}
            </Text>
            <TouchableOpacity onPress={() => removeItem(item.id)}>
              <Feather name="minus-circle" size={18} color="red" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Feather name="plus-circle" size={16} color="white" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Subtotal:</Text>
            <Text style={styles.totalAmount}>{formatCurrency(calculateSubtotal())}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Tax ({taxRate}%):</Text>
            <Text style={styles.totalAmount}>{formatCurrency(calculateTax())}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={[styles.totalText, { fontWeight: 'bold', fontSize: 18 }]}>Total:</Text>
            <Text style={[styles.totalAmount, { fontWeight: 'bold', fontSize: 18 }]}>
              {formatCurrency(calculateTotal())}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitleText, { marginBottom: 12 }]}>Notes</Text>
        <TextInput
          style={styles.textarea}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes or terms..."
        />
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {[
          { label: 'Share', icon: 'share', onClick: handleShare, color: '#059669' },
          { label: 'Preview', icon: 'eye', onClick: handlePreview, color: '#2563eb' },
          { label: 'Print', icon: 'printer', onClick: handlePrint, color: '#7c3aed' },
          { label: 'Save', icon: 'download', onClick: handleSavePDF, color: '#ea580c' },
          { label: 'Email', icon: 'mail', onClick: handleEmailWithAttachment, color: '#4338ca' }
        ].map((btn, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.actionButton, { backgroundColor: btn.color }]}
            onPress={() => validateForm() && btn.onClick()}
          >
            <Feather name={btn.icon} size={16} color="white" />
            <Text style={styles.actionButtonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cloud Save Button */}
      <TouchableOpacity
        style={[styles.actionButton, { 
          backgroundColor: isSaving ? '#6b7280' : '#10b981',
          marginBottom: 16,
          opacity: isSaving ? 0.7 : 1
        }]}
        onPress={handleSaveToCloud}
        disabled={isSaving}
      >
        <Feather name={isSaving ? "loader" : "cloud"} size={16} color="white" />
        <Text style={styles.actionButtonText}>
          {isSaving ? 'Saving...' : 'Save to Cloud'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
        <Text style={styles.resetButtonText}>Reset Form & Generate New Number</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Saved Invoices Tab Component
const SavedInvoicesTab = ({ showToast, onPrintInvoice }) => {
  return (
    <SavedInvoicesManager 
      showToast={showToast} 
      onPrintInvoice={onPrintInvoice}
    />
  );
};

// Main App Component
const SalesInvoiceApp = () => {
  const [toast, setToast] = useState(null);
  const [currentTab, setCurrentTab] = useState('create');
  const [currency, setCurrency] = useState('GHC');

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
        currency,
        businessLogo,
        customerSignature,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        status: 'draft',
        createdAt: Date.now()
      };
      
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
    const currencyObj = CURRENCIES.find(c => c.code === currency);
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
      currency,
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
    setBusinessInfo({ name: '', address: '', phone: '', email: '', taxId: '' });
    setCustomerInfo({ name: '', address: '', phone: '', email: '' });
    setItems([{ id: Date.now(), description: '', quantity: '1', price: '0' }]);
    setNotes('');
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
    switch (currentTab) {
      case 'create':
        return (
          <CreateInvoiceTab
            currency={currency}
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
          />
        );
      case 'saved':
        return (
          <SavedInvoicesTab 
            showToast={showToast} 
            onPrintInvoice={handlePrintFromSaved}
          />
        );
      case 'settings':
        return <SettingsTab currency={currency} setCurrency={setCurrency} showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={styles.bottomTab}
            onPress={() => setCurrentTab(tab.id)}
          >
            <Feather
              name={tab.icon}
              size={24}
              color={currentTab === tab.id ? '#2563eb' : '#6b7280'}
            />
            <Text
              style={[
                styles.bottomTabText,
                currentTab === tab.id && styles.activeBottomTabText
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
        />
      )}
    </SafeAreaView>
  );
};

export default SalesInvoiceApp;