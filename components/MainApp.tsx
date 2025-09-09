// components/MainApp.tsx - UPDATED WITH INVENTORY INTEGRATION
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useCallback, useRef } from 'react';
import { View,Text,TextInput,TouchableOpacity,ScrollView,Alert,Share,Linking,SafeAreaView,StatusBar,Modal} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { styles, darkStyles} from 'components/Styles/MainAppStyles';
import { SavedInvoicesManager } from './savedInvoices';
import SettingsTab from './SettingsTab';
import ManageCustomers from './ManageCustomers';
import { PrintPdf } from './printPdf';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from 'components/Login';
import { generateInvoicePdf } from './printPdf';
import { uploadPdfToDrive } from 'utils/googleDriveUpload';
import UploadScreen from './UploadScreen';
import InventoryManagement from './InventoryManagement';
import { CurrencyProvider } from "../components/CurrencyContext";
import { CustomerProvider, useCustomers } from "../contexts/CustomerContext";
import handleSendInvoice from '../utils/handleSendInvoice'

// Add this button in your component to test auth
const testAuth = async () => {
  const result = await debugAuth();
  console.log('Auth test result:', result);
};

// Customer interface
interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: number;
}

// Product interface
interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  sku: string;
  createdAt: number;
  updatedAt: number;
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in when app starts
  useEffect(() => {
    checkAuthStatus();
  }, []);



  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (token) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      // Remove user session or token if you use one
      await AsyncStorage.removeItem('@user_token'); // or your auth key
      await AsyncStorage.multiRemove(['logged_in_user', 'userProfile']);

      // Optionally clear other sensitive data
      await AsyncStorage.removeItem('@user_session');

      // Set logged in state to false - this will show the login screen
      setIsLoggedIn(false);

      // Show success message (optional)
      Alert.alert('Logged Out', 'You have been successfully logged out.');

    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'An error occurred while logging out.');
      // Even if there's an error, we should still log them out for security
      setIsLoggedIn(false);
    }
  };

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <CustomerProvider>
      <SalesInvoiceApp onLogout={handleLogout} />
    </CustomerProvider>
  );
};

const handlePrintInvoice = async (invoice) => {
  await generateInvoicePdf(invoice);
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
      padding: 26,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1000,
      maxWidth: 300
    }}>
      <Feather name={iconName} size={20}  color="white" />
      <Text style={{ color: 'white', marginLeft: 8, padding: 9, flex: 1 }}>{message}</Text>
      <TouchableOpacity onPress={onClose}>
        <Feather name="x" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
};


// Comprehensive Currency list
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'GHC', symbol: '₵', name: 'Ghana Cedi' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
  { code: 'PYG', symbol: '₲', name: 'Paraguayan Guarani' },
  { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Boliviano' },
  { code: 'VEF', symbol: 'Bs.', name: 'Venezuelan Bolivar' },
  { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc' },
  { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
  { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc' },
  { code: 'SOS', symbol: 'S', name: 'Somali Shilling' },
  { code: 'SSP', symbol: '£', name: 'South Sudanese Pound' },
  { code: 'SZL', symbol: 'E', name: 'Swazi Lilangeni' },
  { code: 'LSL', symbol: 'M', name: 'Lesotho Loti' },
  { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' },
  { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical' },
  { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza' },
  { code: 'CDF', symbol: 'FC', name: 'Congolese Franc' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
  { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo' },
  { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra' },
  { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi' },
  { code: 'GNF', symbol: 'FG', name: 'Guinean Franc' },
  { code: 'LRD', symbol: '$', name: 'Liberian Dollar' },
  { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone' },
  { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee' },
  { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee' },
  { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary' },
  { code: 'KMF', symbol: 'CF', name: 'Comorian Franc' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
  { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar' },
  { code: 'LYD', symbol: 'ل.د', name: 'Libyan Dinar' },
  { code: 'SDG', symbol: '£', name: 'Sudanese Pound' },
  { code: 'JOD', symbol: 'د.أ', name: 'Jordanian Dinar' },
  { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal' },
  { code: 'YER', symbol: '﷼', name: 'Yemeni Rial' },
  { code: 'IRR', symbol: '﷼', name: 'Iranian Rial' },
  { code: 'AFN', symbol: '؋', name: 'Afghan Afghani' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee' },
  { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee' },
  { code: 'BTN', symbol: 'Nu.', name: 'Bhutanese Ngultrum' },
  { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
  { code: 'LAK', symbol: '₭', name: 'Laotian Kip' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'BND', symbol: 'B$', name: 'Brunei Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'KPW', symbol: '₩', name: 'North Korean Won' },
  { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  { code: 'RSD', symbol: 'дин.', name: 'Serbian Dinar' },
  { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar' },
  { code: 'ALL', symbol: 'L', name: 'Albanian Lek' },
  { code: 'BAM', symbol: 'KM', name: 'Bosnia-Herzegovina Convertible Mark' },
  { code: 'ISK', symbol: 'kr', name: 'Icelandic Krona' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
  { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
  { code: 'AMD', symbol: '֏', name: 'Armenian Dram' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
  { code: 'KGS', symbol: 'сом', name: 'Kyrgyzstani Som' },
  { code: 'TJS', symbol: 'ЅМ', name: 'Tajikistani Somoni' },
  { code: 'TMT', symbol: 'T', name: 'Turkmenistani Manat' },
  { code: 'UZS', symbol: 'so\'m', name: 'Uzbekistani Som' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' },
  { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina' },
  { code: 'SBD', symbol: 'SI$', name: 'Solomon Islands Dollar' },
  { code: 'TOP', symbol: 'T$', name: 'Tongan Pa\'anga' },
  { code: 'WST', symbol: 'WS$', name: 'Samoan Tala' },
  { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu' },
  { code: 'XPF', symbol: '₣', name: 'CFP Franc' },
  { code: 'ANG', symbol: 'ƒ', name: 'Netherlands Antillean Guilder' },
  { code: 'AWG', symbol: 'ƒ', name: 'Aruban Florin' },
  { code: 'BBD', symbol: '$', name: 'Barbadian Dollar' },
  { code: 'BMD', symbol: '$', name: 'Bermudian Dollar' },
  { code: 'BSD', symbol: '$', name: 'Bahamian Dollar' },
  { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar' },
  { code: 'CUC', symbol: '$', name: 'Cuban Convertible Peso' },
  { code: 'CUP', symbol: '₱', name: 'Cuban Peso' },
  { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso' },
  { code: 'FKP', symbol: '£', name: 'Falkland Islands Pound' },
  { code: 'GIP', symbol: '£', name: 'Gibraltar Pound' },
  { code: 'GYD', symbol: '$', name: 'Guyanese Dollar' },
  { code: 'HTG', symbol: 'G', name: 'Haitian Gourde' },
  { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar' },
  { code: 'KYD', symbol: '$', name: 'Cayman Islands Dollar' },
  { code: 'SHP', symbol: '£', name: 'Saint Helena Pound' },
  { code: 'SRD', symbol: '$', name: 'Surinamese Dollar' },
  { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar' },
  { code: 'TVD', symbol: '$', name: 'Tuvaluan Dollar' },
  { code: 'XCD', symbol: '$', name: 'East Caribbean Dollar' },
  { code: 'SVC', symbol: '$', name: 'Salvadoran Colón' },
  { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba' },
  { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón' },
  { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa' },
  { code: 'HNL', symbol: 'L', name: 'Honduran Lempira' },
  { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal' }
];

// Default app settings
const DEFAULT_APP_SETTINGS = {
  currency: 'USD',
  darkMode: false,
  autoSave: true,
  defaultTaxRate: '10',
  defaultDiscountRate: '0',
  companyName: '',
  companyEmail: '',
  notifications: true,
  autoBackup: false
};


// Customer Dropdown Component
const CustomerDropdown = ({ customers, selectedCustomer, onSelectCustomer, isDarkMode, onAddNew }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef(null);
  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  // Scroll functions
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };


  return (
    <View style={{ marginBottom: 16, zIndex: 1000 }}>
      <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
        Select Customer:
      </Text>

      <TouchableOpacity
        style={[
          currentStyles.input,
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingRight: 12
          }
        ]}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <Text style={{
          color: selectedCustomer ? (isDarkMode ? '#f3f4f6' : '#1f2937') : (isDarkMode ? '#9ca3af' : '#6b7280'),
          flex: 1
        }}>
          {selectedCustomer ? selectedCustomer.name : 'Choose a customer or enter manually'}
        </Text>
        <Feather
          name={showDropdown ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={isDarkMode ? '#9ca3af' : '#6b7280'}
        />
      </TouchableOpacity>

      {showDropdown && (
        <View style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: isDarkMode ? '#374151' : 'white',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
          maxHeight: 300,
          zIndex: 1001,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5
        }}>
          {/* Search Input */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb'
          }}>
            <Feather name="search" size={16} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 14,
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                paddingVertical: 0
              }}
              placeholder="Search customers..."
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={{ padding: 4 }}
              >
                <Feather name="x" size={14} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 250 }}
          >
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb'
              }}
              onPress={() => {
                setShowDropdown(false);
                setSearchQuery('');
                onAddNew();
              }}
            >
              <Feather name="plus" size={16} color="#2563eb" />
              <Text style={{
                marginLeft: 8,
                color: '#2563eb',
                fontWeight: '500'
              }}>
                Add New Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: 12,
                borderBottomWidth: filteredCustomers.length > 0 ? 1 : 0,
                borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb'
              }}
              onPress={() => {
                onSelectCustomer(null);
                setShowDropdown(false);
                setSearchQuery('');
              }}
            >
              <Text style={{
                color: isDarkMode ? '#f3f4f6' : '#1f2937'
              }}>
                Enter manually
              </Text>
            </TouchableOpacity>

            {filteredCustomers.length === 0 && searchQuery.length > 0 ? (
              <View style={{
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Feather name="search" size={24} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
                <Text style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  textAlign: 'center'
                }}>
                  No customers found{'\n'}Try a different search term or add new customer 
                </Text>
              </View>
            ) : (
              filteredCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb'
                  }}
                  onPress={() => {
                    onSelectCustomer(customer);
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={{
                    fontWeight: '500',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    marginBottom: 2
                  }}>
                    {customer.name}
                  </Text>
                  {customer.email && (
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#9ca3af' : '#6b7280'
                    }}>
                      {customer.email}
                    </Text>
                  )}
                  {customer.phone && (
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#9ca3af' : '#6b7280'
                    }}>
                      {customer.phone}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Scroll Navigation Buttons */}
          {filteredCustomers.length > 3 && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: isDarkMode ? '#4b5563' : '#e5e7eb'
            }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  minWidth: 80,
                  justifyContent: 'center'
                }}
                onPress={scrollToTop}
              >
                <Feather name="chevron-up" size={14} color={isDarkMode ? '#f3f4f6' : '#374151'} />
                <Text style={{
                  marginLeft: 4,
                  fontSize: 12,
                  color: isDarkMode ? '#f3f4f6' : '#374151',
                  fontWeight: '500'
                }}>
                  Top
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  minWidth: 80,
                  justifyContent: 'center'
                }}
                onPress={scrollToBottom}
              >
                <Text style={{
                  marginRight: 4,
                  fontSize: 12,
                  color: isDarkMode ? '#f3f4f6' : '#374151',
                  fontWeight: '500'
                }}>
                  Bottom
                </Text>
                <Feather name="chevron-down" size={14} color={isDarkMode ? '#f3f4f6' : '#374151'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};



// Inventory Product Picker Modal
const InventoryPickerModal = ({ visible, onClose, onSelectProduct, isDarkMode }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  useEffect(() => {
  const loadProducts = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('inventory_products');
      const products = stored ? JSON.parse(stored) : [];
      setProducts(products);
      setFilteredProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (visible) {
    loadProducts();
  }
}, [visible]);

useEffect(() => {
  filterProducts();

}, [searchText, products]);

  const filterProducts = () => {
    let filtered = [...products];

    if (searchText && searchText.trim()) {
      const search = searchText.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const name = (product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const sku = (product.sku || '').toLowerCase();
        const category = (product.category || '').toLowerCase();

        return name.includes(search) ||
               description.includes(search) ||
               sku.includes(search) ||
               category.includes(search);
      });
    }

    setFilteredProducts(filtered);
  };

  const handleSelectProduct = (product) => {
    onSelectProduct(product);
    setSearchText('');
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
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
        <View style={{
          backgroundColor: isDarkMode ? '#374151' : 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '80%',
          minHeight: '60%'
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb'
          }}>
            <Text style={[currentStyles.sectionTitleText, { fontSize: 18, marginBottom: 0 }]}>
              Select from Inventory
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={{ padding: 16 }}>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[currentStyles.input, { paddingLeft: 40 }]}
                placeholder="Search products..."
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                value={searchText}
                onChangeText={setSearchText}
              />
              <Feather
                name="search"
                size={20}
                color={isDarkMode ? '#9ca3af' : '#6b7280'}
                style={{ position: 'absolute', left: 12, top: 12 }}
              />
            </View>
          </View>

          {/* Products List */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Loading products...</Text>
              </View>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={{
                    flexDirection: 'row',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                    alignItems: 'center'
                  }}
                  onPress={() => handleSelectProduct(product)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      marginBottom: 4
                    }}>
                      {product.name}
                    </Text>

                    {product.description ? (
                      <Text style={{
                        fontSize: 14,
                        color: isDarkMode ? '#d1d5db' : '#6b7280',
                        marginBottom: 4
                      }}>
                        {product.description}
                      </Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#2563eb'
                      }}>
                        {formatCurrency(parseFloat(product.price || 0))}
                      </Text>

                      <Text style={{
                        fontSize: 12,
                        color: parseInt(product.stock || 0) <= 5 ? '#ef4444' : '#059669',
                        fontWeight: '500'
                      }}>
                        Stock: {product.stock}
                      </Text>

                      <Text style={{
                        fontSize: 12,
                        backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                        color: isDarkMode ? '#d1d5db' : '#6b7280',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12
                      }}>
                        {product.category}
                      </Text>
                    </View>

                    {product.sku ? (
                      <Text style={{
                        fontSize: 12,
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        marginTop: 4
                      }}>
                        SKU: {product.sku}
                      </Text>
                    ) : null}
                  </View>

                  <Feather name="chevron-right" size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 64
              }}>
                <Feather
                  name={searchText ? 'search' : 'package'}
                  size={64}
                  color={isDarkMode ? '#4b5563' : '#d1d5db'}
                />
                <Text style={{
                  fontSize: 16,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  marginTop: 16,
                  textAlign: 'center'
                }}>
                  {searchText
                    ? 'No products found\nTry adjusting your search'
                    : 'No products in inventory\nAdd products in the Inventory tab'
                  }
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
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
  TaxRate,
  setTaxRate,
  discountRate,
  setDiscountRate,
  addItem,
  removeItem,
  updateItem,
  calculateSubtotal,
  calculateDiscount,
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
  appSettings,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  showAddCustomerModal,
  setShowAddCustomerModal,
  setShowHelpModal,

  // New inventory props
  showInventoryPicker,
  setShowInventoryPicker,
  handleUseProduct,

  // Debug function
  debugCustomerStorage
}) => {
  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    if (customer) {
      setCustomerInfo({
        name: customer.name,
        address: customer.address,
        phone: customer.phone,
        email: customer.email,
        id: customer.id
      });
    } else {
      setCustomerInfo({ name: '', address: '', phone: '', email: '', id: '' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>
      {/* Header OUTSIDE the ScrollView */}
      <View style={currentStyles.header}>
        <View style={currentStyles.headerTitle}>
          <Feather name="file-text" size={28} color="white"
          style={{
          marginRight: 6,
         marginLeft: 10,  // space between icon and text
         alignSelf: 'center', // vertical alignment
         opacity: 0.9,
         paddingTop: 22,   // slightly faded look
    // slight rotation for style


  }}/>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
  <TouchableOpacity             
    onPress={() => setShowHelpModal(true)}             
    style={{ marginRight: 6 }}           
  >             
    <Feather 
      name="info" 
      size={20} 
      color="white"              
      style={{             
        opacity: 0.9,             
        paddingTop: 22,             
        position: 'relative',              
      }}             
    />           
  </TouchableOpacity>
</View>
          <Text style={currentStyles.headerText}>Create {documentType === 'invoice' ? 'Invoice' : 'Receipt'}</Text>
        </View>
        <Text style={currentStyles.headerSubtext}>Generate professional invoices and receipts</Text>
      </View>

      {/* Scrollable content BELOW the header */}
      <ScrollView
        style={[currentStyles.scrollContainer, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }]}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
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
                editable={true}
                placeholder="Auto-generated"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Date:</Text>
              <TextInput
                style={currentStyles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              />
            </View>
          </View>
          <View style={currentStyles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Tax Rate (%):</Text>
              <TextInput
                style={currentStyles.input}
                value={TaxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
                placeholder={appSettings.defaultTaxRate || "10"}
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Discount (%):</Text>
              <TextInput
                style={currentStyles.input}
                value={discountRate}
                onChangeText={setDiscountRate}
                keyboardType="numeric"
                placeholder={appSettings.defaultDiscountRate || "0"}
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
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
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            value={businessInfo.name}
            onChangeText={(text) => setBusinessInfo({ ...businessInfo, name: text })}
          />
          <TextInput
            style={currentStyles.input}
            placeholder="Address"
            value={businessInfo.address}
            onChangeText={(text) => setBusinessInfo({ ...businessInfo, address: text })}
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          />
          <TextInput
            style={currentStyles.input}
            placeholder="Phone"
            value={businessInfo.phone}
            onChangeText={(text) => setBusinessInfo({ ...businessInfo, phone: text })}
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          />
          <TextInput
            style={currentStyles.input}
            placeholder="Email"
            value={businessInfo.email}
            onChangeText={(text) => setBusinessInfo({ ...businessInfo, email: text })}
            keyboardType="email-address"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          />
          <TextInput
            style={currentStyles.input}
            placeholder="Tax ID (Optional)"
            value={businessInfo.taxId}
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            onChangeText={(text) => setBusinessInfo({ ...businessInfo, taxId: text })}
          />
        </View>

        {/* Customer Info */}
        <View style={currentStyles.section}>
          <View style={currentStyles.sectionTitle}>
            <Feather name="user" size={20} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
            <Text style={currentStyles.sectionTitleText}>Customer Information</Text>
          </View>

          {/* Customer Dropdown */}
          <CustomerDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={handleCustomerSelect}
            isDarkMode={isDarkMode}
            onAddNew={() => setShowAddCustomerModal(true)}
            onDebug={debugCustomerStorage}
          />

          {/* Customer Signature Section */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>Business Signature:</Text>
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
                <Text style={currentStyles.actionButtonText}>Add Business Signature</Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={currentStyles.input}
            placeholder="Customer Name"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            value={customerInfo.name}
            onChangeText={(text) => {
              setCustomerInfo({ ...customerInfo, name: text });
              // Clear selected customer if user manually edits
              if (selectedCustomer) setSelectedCustomer(null);
            }}
          />
          <TextInput
            style={currentStyles.input}
            placeholder="Phone"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            value={customerInfo.phone}
            onChangeText={(text) => {
              setCustomerInfo({ ...customerInfo, phone: text });
              if (selectedCustomer) setSelectedCustomer(null);
            }}
          />
          <TextInput
            style={currentStyles.input}
            placeholder="Email"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            value={customerInfo.email}
            onChangeText={(text) => {
              setCustomerInfo({ ...customerInfo, email: text });
              if (selectedCustomer) setSelectedCustomer(null);
            }}
            keyboardType="email-address"
          />

          <TextInput
            style={currentStyles.input}
            placeholder="Address"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            value={customerInfo.address}
            onChangeText={(text) => {
              setCustomerInfo({ ...customerInfo, address: text });
              if (selectedCustomer) setSelectedCustomer(null) ;
            }}
            keyboardType="Address"
       />
            </View>

        {/* Items */}
        <View style={currentStyles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={currentStyles.sectionTitleText}>Items</Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#7c3aed',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16
              }}
              onPress={() => setShowInventoryPicker(true)}
            >
              <Feather name="package" size={14} color="white" />
              <Text style={{ color: 'white', fontSize: 12, marginLeft: 4 }}>From Inventory</Text>
            </TouchableOpacity>
          </View>

          {items.map(item => (
            <View key={item.id} style={currentStyles.itemRow}>
              <TextInput
                style={currentStyles.itemDescription}
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
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
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              />
              <TextInput
                style={currentStyles.itemPrice}
                placeholder="Price"
                value={item.price}
                onChangeText={(text) => updateItem(item.id, 'price', text)}
                keyboardType="numeric"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              />
              <Text style={currentStyles.itemTotal}>
                {formatCurrency(parseFloat(item.quantity || 0) * parseFloat(item.price || 0))}
              </Text>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Feather name="minus-circle" size={18} color="red" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[currentStyles.addButton, { flex: 1 }]} onPress={addItem}>
              <Feather name="plus-circle" size={16} color="white" />
              <Text style={currentStyles.addButtonText}>Add Manual Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[currentStyles.addButton, { flex: 1, backgroundColor: '#7c3aed' }]}
              onPress={() => setShowInventoryPicker(true)}
            >
              <Feather name="package" size={16} color="white" />
              <Text style={currentStyles.addButtonText}>Add from Inventory</Text>
            </TouchableOpacity>
          </View>

          {/* Totals */}
          <View style={currentStyles.totalsContainer}>
            <View style={currentStyles.totalRow}>
              <Text style={currentStyles.totalText}>Subtotal:</Text>
              <Text style={currentStyles.totalAmount}>{formatCurrency(calculateSubtotal())}</Text>
            </View>
            <View style={currentStyles.totalRow}>
              <Text style={currentStyles.totalText}>Discount ({discountRate}%):</Text>
              <Text style={currentStyles.totalAmount}>-{formatCurrency(calculateDiscount())}</Text>
            </View>
            <View style={currentStyles.totalRow}>
              <Text style={currentStyles.totalText}>Tax ({TaxRate}%):</Text>
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
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
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



        <TouchableOpacity style={currentStyles.resetButton} onPress={resetForm}>
          <Text style={currentStyles.resetButtonText}>Reset Form & Generate New Number</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Inventory Picker Modal */}
      <InventoryPickerModal
        visible={showInventoryPicker}
        onClose={() => setShowInventoryPicker(false)}
        onSelectProduct={handleUseProduct}
        isDarkMode={isDarkMode}
      />
    </View>
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

// Customer Management Tab Component
const CustomerManagementTab = ({ showToast, isDarkMode, formatCurrency, onCustomersUpdate }) => {
  return (
    <View style={{ flex: 1 }}>
      <ManageCustomers
        showToast={showToast}
        isDarkMode={isDarkMode}
        formatCurrency={formatCurrency}
        onCustomersUpdate={onCustomersUpdate}
      />
    </View>
  );
};

// Inventory Management Tab Component
const InventoryManagementTab = ({ showToast, isDarkMode, onUseProduct, formatCurrency }) => {
  return (
    <InventoryManagement
      showToast={showToast}
      isDarkMode={isDarkMode}
      onUseProduct={onUseProduct}
      formatCurrency={formatCurrency}
    />
  );
};

// Add Customer Modal Component
const AddCustomerModal = ({ visible, onClose, onAdd, isDarkMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  const handleAdd = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    const newCustomer = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      createdAt: Date.now()
    };

    onAdd(newCustomer);
    setFormData({ name: '', address: '', phone: '', email: '' });
    onClose();
  };

  const handleClose = () => {
    setFormData({ name: '', address: '', phone: '', email: '' });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={[
          currentStyles.section,
          {
            margin: 20,
            width: '90%',
            maxHeight: '80%',
            backgroundColor: isDarkMode ? '#374151' : 'white'
          }
        ]}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={[currentStyles.sectionTitleText, { fontSize: 20 }]}>Add New Customer</Text>
            <TouchableOpacity onPress={handleClose}>
              <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
              Customer Name *
            </Text>
            <TextInput
              style={currentStyles.input}
              placeholder="Enter customer name"
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
              Address
            </Text>
            <TextInput
              style={currentStyles.input}
              placeholder="Enter address"
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
            />

            <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
              Phone
            </Text>
            <TextInput
              style={currentStyles.input}
              placeholder="Enter phone number"
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
              Email
            </Text>
            <TextInput
              style={currentStyles.input}
              placeholder="Enter email address"
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
            />
          </ScrollView>

          <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
            <TouchableOpacity
              style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#6b7280' }]}
              onPress={handleClose}
            >
              <Text style={currentStyles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#2563eb' }]}
              onPress={handleAdd}
            >
              <Text style={currentStyles.actionButtonText}>Add Customer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Info Modal Component to explain how to use the app
const InfoModal = ({ visible, onClose, isDarkMode }) => {
  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={[currentStyles.section, {
          margin: 20,
          width: '85%',
          backgroundColor: isDarkMode ? '#374151' : 'white'
        }]}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={[currentStyles.sectionTitleText, { fontSize: 18 }]}>
              How to Use QuickBill Pro
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#f3f4f6' : '#1f2937', marginBottom: 8 }}>
                📋 Getting Started
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Set up your business information in Settings, add customers for quick selection, and manage your products in the Inventory tab.
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>
                📄 Creating Documents
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Choose Invoice or Receipt, select customers, add items from inventory or manually, and generate professional documents.
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: 'bold', color: '#059669', marginBottom: 8 }}>
                👥 Customer Management
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Add customer details, view purchase history, and search through your customer database easily.
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: 'bold', color: '#7c3aed', marginBottom: 8 }}>
                📦 Inventory Features
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Organize products by categories, track stock levels, and use products directly in invoices.
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: 'bold', color: '#ea580c', marginBottom: 8 }}>
                🔧 Document Actions
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Share, preview, print, save, or email your documents with professional formatting.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[currentStyles.actionButton, { backgroundColor: '#2563eb', marginTop: 20 }]}
            onPress={onClose}
          >
            <Text style={currentStyles.actionButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Main App Component - Now accepts onLogout as a prop
const SalesInvoiceApp = ({ onLogout }) => {
const [toast, setToast] = useState(null);
const [currentTab, setCurrentTab] = useState('create');
const [showHelpModal, setShowHelpModal] = useState(false);

  // Use centralized customer management
  const { customers, addCustomer, updateCustomer, deleteCustomer, saveCustomers } = useCustomers();

  // App settings state
  const [appSettings, setAppSettings] = useState(DEFAULT_APP_SETTINGS);

  // Load application settings from AsyncStorage
  const loadAppSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@app_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new keys are present
        const merged = { ...DEFAULT_APP_SETTINGS, ...parsed };
        setAppSettings(merged);
      } else {
        // Initialize storage with defaults if nothing is stored
        await AsyncStorage.setItem('@app_settings', JSON.stringify(DEFAULT_APP_SETTINGS));
        setAppSettings(DEFAULT_APP_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
      // Fallback to defaults on error
      setAppSettings(DEFAULT_APP_SETTINGS);
    }
  }, []);

  // Business and customer info
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    TaxRate: ''
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    id: ''
  });

  // Customer management - now using centralized context
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);


  // Inventory management
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);

  // Document data
  const [items, setItems] = useState([{ id: 1, description: '', quantity: '', price: '' }]);
  const [documentType, setDocumentType] = useState('invoice');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [TaxRate, setTaxRate] = useState('10');
  const [discountRate, setDiscountRate] = useState('0');
  const [invoiceCounter, setInvoiceCounter] = useState(1);
  const [receiptCounter, setReceiptCounter] = useState(1);

  // Camera and images
    const [businessLogo, setBusinessLogo] = useState(null);
    const [customerSignature, setCustomerSignature] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
  // Remove this line completely (it's causing the duplicate error):
   const [showPrintPdf, setShowPrintPdf] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  const showToast = (msg, type = 'info') => setToast({ message: msg, type });
  // const [customers, setCustomers] = useState<Customer[]>([]);


  // Add new customer using context
  const addNewCustomer = async (customerData) => {
    try {
      console.log('Adding new customer:', customerData);

      // Use context's addCustomer function
      const newCustomer = await addCustomer(customerData);

      showToast('Customer added successfully', 'success');

      // Auto-select the new customer
      setSelectedCustomer(newCustomer);
      setCustomerInfo({
        name: newCustomer.name,
        address: newCustomer.address,
        phone: newCustomer.phone,
        email: newCustomer.email,
        id: newCustomer.id
      });

      console.log('MainApp: Added new customer');
      console.log('MainApp: Total customers after add:', customers.length);
    } catch (error) {
      console.error('MainApp: Error adding customer:', error);
      showToast('Error adding customer', 'error');
    }
  };

  // Debug function to check AsyncStorage
  const debugCustomerStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('customers');
      console.log('🔍 AsyncStorage Debug - Raw stored data:', stored);

      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🔍 AsyncStorage Debug - Parsed customers:', parsed);
        console.log('🔍 AsyncStorage Debug - Customer count:', parsed.length);
        console.log('🔍 AsyncStorage Debug - Customer names:', parsed.map((c, i) => `${i + 1}. ${c.name}`).join(', '));
        console.log('🔍 AsyncStorage Debug - Customer IDs:', parsed.map(c => c.id));
      } else {
        console.log('🔍 AsyncStorage Debug - No customers found in storage');
      }

      console.log('🔍 Context Debug - Current customers in context:', customers);
      console.log('🔍 Context Debug - Context customer count:', customers.length);
      console.log('🔍 Context Debug - Context customer names:', customers.map((c, i) => `${i + 1}. ${c.name}`).join(', '));
    } catch (error) {
      console.error('🔍 Debug error:', error);
    }
  };

  // Handle using product from inventory
  const handleUseProduct = (product) => {
    const newItem = {
      id: Date.now() + Math.random(), // Ensure unique ID
      description: product.name + (product.description ? ` - ${product.description}` : ''),
      quantity: '1',
      price: product.price,
      fromInventory: true,
      inventoryId: product.id,
      sku: product.sku || ''
    };

    setItems(prevItems => [...prevItems, newItem]);
    showToast(`${product.name} added to invoice`, 'success');
    setShowInventoryPicker(true);
  };

  // Load app settings on startup
  useEffect(() => {
    loadAppSettings();
  }, []);

  // Persist app settings when they change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('@app_settings', JSON.stringify(appSettings));
      } catch (error) {
        console.error('Error saving app settings:', error);
      }
    })();
  }, [appSettings]);

  // Update tax rate when default changes
  useEffect(() => {
    if (appSettings.defaultTaxRate && appSettings.defaultTaxRate !== TaxRate) {
      setTaxRate(appSettings.defaultTaxRate);
    }
  }, [appSettings.defaultTaxRate]);

  // Update discount rate when default changes
  useEffect(() => {
    if (appSettings.defaultDiscountRate && appSettings.defaultDiscountRate !== discountRate) {
      setDiscountRate(appSettings.defaultDiscountRate);
    }
  }, [appSettings.defaultDiscountRate]);

  // Update business info from settings
  useEffect(() => {
    setBusinessInfo({
      name: appSettings.companyName || '',
      email: appSettings.companyEmail || '',
      phone: appSettings.companyPhone || '',
      address: appSettings.companyAddress || '',
      TaxRate: appSettings.TaxRate || '',
    });
  }, [
    appSettings.companyName,
    appSettings.companyEmail,
    appSettings.companyPhone,
    appSettings.companyAddress,
    appSettings.TaxRate,
  ]);

  useEffect(() => {
    const loadCounters = async () => {
      const inv = await AsyncStorage.getItem('@invoice_counter');
      const rct = await AsyncStorage.getItem('@receipt_counter');
      setInvoiceCounter(inv ? parseInt(inv, 10) : 1);
      setReceiptCounter(rct ? parseInt(rct, 10) : 1);
    };
    loadCounters();
  }, []);


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
    const pref = documentType === 'invoice' ? 'INV' : 'RCT';
    const num = `${pref}-${String(current).padStart(4, '0')}`;
    setInvoiceNumber(num);
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
        showToast('Business signature captured!', 'success');
      }
    } catch (error) {
      showToast('Error picking image', 'error');
    }
  };

 
  const handleSaveToCloud = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Generate PDF first
      const invoiceData = {
        id: Date.now().toString(),
        documentType,
        invoiceNumber,
        date,
        businessInfo,
        customerInfo,
        items,
        TaxRate,
        notes,
        currency: appSettings.currency,
        businessLogo,
        customerSignature,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        createdAt: Date.now()
      };

      const pdfPath = await generateInvoicePdf(invoiceData);
      
      // Trigger Google authentication
      const authResult = await promptAsync();
      
      if (authResult.type === 'success') {
        const { access_token } = authResult.params;
        
        // Upload to Google Drive
        const result = await uploadPdfToDrive(pdfPath, access_token, `${invoiceNumber}.pdf`);
        
        showToast('✅ Successfully uploaded to Google Drive!', 'success');
      } else {
        throw new Error('Authentication cancelled');
      }
      
    } catch (error) {
      console.error('Cloud save error:', error);
      showToast(`❌ Upload failed: ${error.message}`, 'error');
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

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    const rate = parseFloat(discountRate) || 0;
    return (subtotal * rate) / 100;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const discountedSubtotal = subtotal - discount;
    const rate = parseFloat(TaxRate) || 0;
    return (discountedSubtotal * rate) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  const formatCurrency = (amount) => {
    const currencyObj = CURRENCIES.find(c => c.code === appSettings.currency);
    return `${currencyObj?.symbol || '$'}${amount.toFixed(2)}`;
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

    try {
      // Build the invoice object
      const invoiceData = {
        id: Date.now().toString(),
        documentType,
        invoiceNumber,
        date,
        businessInfo,
        customerInfo,
        items,
        TaxRate,
        discountRate,
        notes,
        currency: appSettings.currency,
        businessLogo,
        customerSignature,
        subtotal: calculateSubtotal(),
        discount: calculateDiscount(),
        tax: calculateTax(),
        total: calculateTotal(),
        status: 'saved',
        createdAt: Date.now()
      };

      // Load existing invoices
      const stored = await AsyncStorage.getItem('savedInvoices');
      const invoices = stored ? JSON.parse(stored) : [];

      // Add new invoice and save
      const updated = [...invoices, invoiceData];
      await AsyncStorage.setItem('savedInvoices', JSON.stringify(updated));

      // Increment and persist the counter
      if (documentType === 'invoice') {
        const next = invoiceCounter + 1;
        setInvoiceCounter(next);
        await AsyncStorage.setItem('@invoice_counter', next.toString());
      } else {
        const next = receiptCounter + 1;
        setReceiptCounter(next);
        await AsyncStorage.setItem('@receipt_counter', next.toString());
      }

      showToast('Invoice saved successfully', 'success');
      generateDocumentNumber(); // Generate the next number for the next invoice
    } catch (err) {
      showToast('Failed to save invoice', 'error');
      console.error(err);
    }
  };

  const generateDocumentText = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
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
${discount > 0 ? `Discount (${discountRate}%): -${formatCurrency(discount)}` : ''}
Tax (${TaxRate}%): ${formatCurrency(tax)}
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
      TaxRate,
      discountRate,
      notes,
      currency: appSettings.currency,
      businessLogo,
      customerSignature,
      subtotal: calculateSubtotal(),
      discount: calculateDiscount(),
      tax: calculateTax(),
      total: calculateTotal(),
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
    setCustomerInfo({ name: '', address: '', phone: '', email: '', id: '' });
    setSelectedCustomer(null);
    setItems([{ id: Date.now(), description: '', quantity: '1', price: '0' }]);
    setNotes('');
    setTaxRate(appSettings.defaultTaxRate || '10');
    setDiscountRate(appSettings.defaultDiscountRate || '0');
    setBusinessLogo(null);
    setCustomerSignature(null);
    generateDocumentNumber();
    showToast('Form reset successfully', 'success');
  };

  const tabs = [
    { id: 'create', label: 'Create', icon: 'plus-circle' },
    { id: 'saved', label: 'Saved', icon: 'folder' },
    { id: 'customers', label: 'Customers', icon: 'users' },
    { id: 'inventory', label: 'Inventory', icon: 'package' },
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
            TaxRate={TaxRate}
            setTaxRate={setTaxRate}
            discountRate={discountRate}
            setDiscountRate={setDiscountRate}
            addItem={addItem}
            removeItem={removeItem}
            updateItem={updateItem}
            calculateSubtotal={calculateSubtotal}
            calculateDiscount={calculateDiscount}
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
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            showAddCustomerModal={showAddCustomerModal}
            setShowAddCustomerModal={setShowAddCustomerModal}
            setShowHelpModal={setShowHelpModal}
            // Inventory integration props
            showInventoryPicker={showInventoryPicker}
            setShowInventoryPicker={setShowInventoryPicker}
            handleUseProduct={handleUseProduct}
            // Debug function
            debugCustomerStorage={debugCustomerStorage}
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
   case 'customers':
 return (
   <CustomerManagementTab
     showToast={showToast}
     isDarkMode={appSettings.darkMode}
     formatCurrency={formatCurrency}
     onCustomersUpdate={() => {}} // Add this to satisfy the prop requirement
   />
 );
      case 'inventory':
        return (
          <InventoryManagementTab
            showToast={showToast}
            isDarkMode={appSettings.darkMode}
            onUseProduct={handleUseProduct}
            formatCurrency={formatCurrency}
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
            // Pass the logout handler received as prop
            onLogout={onLogout}
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
        backgroundColor={appSettings.darkMode ? "#111827" : "#f9f9f9"} 
      />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <View style={{ flex: 1, backgroundColor: appSettings.darkMode ? '#1f2937' : '#f3f4f6' }}>
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
                { color: currentTab === tab.id ? '#2563eb' : (appSettings.darkMode ? '#9ca3af' : '#6b7280') }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Customer Modal */}
      <AddCustomerModal
        visible={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onAdd={addNewCustomer}
        isDarkMode={appSettings.darkMode}
      />

      {/* Print PDF Modal */}
      {showPrintPdf && invoiceToPrint && (
        <PrintPdf
          visible={showPrintPdf}
          onClose={() => {
            setShowPrintPdf(false);
            setInvoiceToPrint(null);
          }}
          invoiceData={invoiceToPrint}
          formatCurrency={formatCurrency}  // <-- pass as a separate prop
          showToast={showToast}
          isDarkMode={appSettings.darkMode}
        />
      )}

      {/* Help Info Modal */}
      <InfoModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        isDarkMode={appSettings.darkMode}
      />
    </SafeAreaView>
  );
};

export default App;