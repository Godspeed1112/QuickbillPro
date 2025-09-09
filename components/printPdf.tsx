// components/printPdf.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
// Removed expo-mail-composer dependency - using Linking API instead

const { width } = Dimensions.get('window');

// Constants
const PDF_CONFIG = {
  width: 595, // A4 width in points
  height: 842, // A4 height in points
  margins: 15 // mm
};

// Comprehensive Currency list - matches MainApp.tsx
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

// Invoice Themes Configuration
const INVOICE_THEMES = {
  modern: {
    name: 'Modern Blue',
    primary: '#2563eb',
    secondary: '#f1f5f9',
    accent: '#0f172a',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    type: 'standard'
  },
  elegant: {
    name: 'Elegant Purple',
    primary: '#7c3aed',
    secondary: '#f8fafc',
    accent: '#1e293b',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    type: 'standard'
  },
  corporate: {
    name: 'Corporate Gray',
    primary: '#374151',
    secondary: '#f9fafb',
    accent: '#111827',
    gradient: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
    type: 'standard'
  },
  vibrant: {
    name: 'Vibrant Green',
    primary: '#059669',
    secondary: '#f0fdfa',
    accent: '#064e3b',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    type: 'standard'
  },
  warm: {
    name: 'Warm Orange',
    primary: '#ea580c',
    secondary: '#fff7ed',
    accent: '#9a3412',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
    type: 'standard'
  },
  minimal: {
    name: 'Minimal Black',
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#404040',
    gradient: 'linear-gradient(135deg, #000000 0%, #404040 100%)',
    type: 'standard'
  },
  thermal: {
    name: 'Thermal Receipt',
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#000000',
    gradient: 'none',
    type: 'thermal'
  }
};

// Utility Functions
const validateImageUri = (uri) => {
  if (!uri || typeof uri !== 'string') return false;
  return uri.startsWith('data:image/') || uri.startsWith('file://') || uri.startsWith('http');
};

const convertImageToBase64 = async (imageUri) => {
  if (!validateImageUri(imageUri)) return null;
  
  try {
    if (imageUri.startsWith('data:image/')) {
      return imageUri;
    }
    
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      console.warn('Image file does not exist:', imageUri);
      return null;
    }
    
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const imageType = imageUri.toLowerCase().includes('.png') ? 'png' : 'jpeg';
    return `data:image/${imageType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

const formatCurrency = (amount, currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  return `${currency.symbol}${Number(amount || 0).toFixed(2)}`;
};

const sanitizeText = (text) => {
  if (!text) return '';
  return String(text).replace(/[<>&"']/g, (match) => {
    const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
    return entities[match];
  });
};

// CSS Styles for different themes
const getCSS = (theme = 'modern') => {
  const themeConfig = INVOICE_THEMES[theme] || INVOICE_THEMES.modern;
  const isThermal = themeConfig.type === 'thermal';
  
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: ${isThermal ? '80mm 297mm' : 'A4'};
      margin: ${isThermal ? '5mm' : PDF_CONFIG.margins + 'mm'};
    }
    
    body {
      font-family: ${isThermal ? "'Courier New', monospace" : "'Arial', 'Helvetica', sans-serif"};
      font-size: ${isThermal ? '9px' : '11px'};
      line-height: ${isThermal ? '1.2' : '1.4'};
      color: ${themeConfig.accent};
      width: ${isThermal ? '70mm' : '210mm'};
      min-height: 297mm;
      margin: 0 auto;
      padding: 0;
      background: white;
    }
    
    .page-container {
      width: 100%;
      max-width: ${isThermal ? '70mm' : '180mm'};
      margin: 0 auto;
    }
    
    /* Theme-specific header styles */
    .header {
      display: ${isThermal ? 'block' : 'table'};
      width: 100%;
      margin-bottom: ${isThermal ? '10px' : '25px'};
      position: relative;
      overflow: hidden;
      page-break-inside: avoid;
      ${isThermal ? `
        text-align: center;
        border-bottom: 2px solid ${themeConfig.primary};
        padding-bottom: 8px;
      ` : theme === 'modern' ? `
        background: ${themeConfig.gradient};
        color: white;
        padding: 20px;
        border-radius: 8px;
      ` : theme === 'elegant' ? `
        border-bottom: 3px solid ${themeConfig.primary};
        padding-bottom: 20px;
        background: ${themeConfig.secondary};
        padding: 20px;
        border-radius: 4px;
      ` : theme === 'vibrant' ? `
        background: ${themeConfig.gradient};
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
      ` : theme === 'minimal' ? `
        border-bottom: 4px solid ${themeConfig.primary};
        padding-bottom: 15px;
      ` : `
        border-bottom: 2px solid ${themeConfig.primary};
        padding-bottom: 15px;
      `}
    }
    
    .header::before {
      ${theme === 'warm' && !isThermal ? `
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: ${themeConfig.gradient};
      ` : ''}
    }
    
    .header-left, .header-right {
      display: ${isThermal ? 'block' : 'table-cell'};
      width: ${isThermal ? '100%' : '50%'};
      vertical-align: top;
      text-align: ${isThermal ? 'center' : 'left'};
    }
    
    .header-right {
      text-align: ${isThermal ? 'center' : 'right'};
      margin-top: ${isThermal ? '8px' : '0'};
    }
    
    .business-logo {
      max-width: ${isThermal ? '60px' : '120px'};
      max-height: ${isThermal ? '30px' : '60px'};
      object-fit: contain;
      margin-bottom: ${isThermal ? '4px' : '10px'};
      display: block;
      ${isThermal ? 'margin-left: auto; margin-right: auto;' : ''}
      /* Fixed logo visibility for all themes */
      ${(theme === 'modern' || theme === 'vibrant') && !isThermal ? 
        'filter: brightness(0) invert(1) drop-shadow(0 0 2px rgba(255,255,255,0.8));' : 
        isThermal ? 'filter: contrast(1.2);' : 
        'filter: contrast(1.1);'}
    }
    
    .business-name {
      font-size: ${isThermal ? '12px' : '18px'};
      font-weight: bold;
      margin-bottom: ${isThermal ? '2px' : '6px'};
      ${isThermal ? `
        text-transform: uppercase;
        letter-spacing: 1px;
        color: ${themeConfig.primary};
      ` : theme === 'modern' || theme === 'vibrant' ? 'color: white;' : `color: ${themeConfig.primary};`}
    }
    
    .document-title {
      font-size: ${isThermal ? '16px' : '28px'};
      font-weight: bold;
      margin-bottom: ${isThermal ? '2px' : '6px'};
      ${isThermal ? `
        text-transform: uppercase;
        letter-spacing: 2px;
        color: ${themeConfig.primary};
        border-bottom: 1px solid ${themeConfig.primary};
        padding-bottom: 2px;
      ` : theme === 'modern' || theme === 'vibrant' ? 'color: white;' : `color: ${themeConfig.primary};`}
      ${theme === 'elegant' && !isThermal ? 'font-family: Georgia, serif;' : ''}
    }
    
    .document-number {
      font-size: ${isThermal ? '10px' : '16px'};
      margin-bottom: ${isThermal ? '2px' : '4px'};
      font-weight: 600;
      ${isThermal ? `
        color: ${themeConfig.accent};
      ` : theme === 'modern' || theme === 'vibrant' ? 'color: rgba(255,255,255,0.9);' : `color: ${themeConfig.accent};`}
    }
    
    .document-date, .document-generated {
      font-size: ${isThermal ? '8px' : '12px'};
      ${isThermal ? `
        color: ${themeConfig.accent};
      ` : theme === 'modern' || theme === 'vibrant' ? 'color: rgba(255,255,255,0.8);' : 'color: #718096;'}
    }
    
    .party-info {
      display: ${isThermal ? 'block' : 'table'};
      width: 100%;
      margin-bottom: ${isThermal ? '8px' : '25px'};
      page-break-inside: avoid;
    }
    
    .party-from, .party-to {
      display: ${isThermal ? 'block' : 'table-cell'};
      width: ${isThermal ? '100%' : '48%'};
      vertical-align: top;
      ${isThermal ? `
        margin-bottom: 6px;
        border-bottom: 1px dashed ${themeConfig.primary};
        padding-bottom: 4px;
      ` : theme === 'elegant' ? `
        background: ${themeConfig.secondary};
        padding: 15px;
        border-radius: 6px;
      ` : theme === 'warm' ? `
        border-left: 4px solid ${themeConfig.primary};
        padding-left: 15px;
      ` : ''}
    }
    
    .party-from {
      padding-right: ${isThermal ? '0' : '4%'};
    }
    
    .party-title {
      font-size: ${isThermal ? '10px' : '14px'};
      font-weight: bold;
      color: ${themeConfig.primary};
      margin-bottom: ${isThermal ? '2px' : '8px'};
      padding-bottom: ${isThermal ? '1px' : '4px'};
      ${isThermal ? `
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 1px solid ${themeConfig.primary};
      ` : theme === 'minimal' ? `
        border-bottom: 2px solid ${themeConfig.primary};
        text-transform: uppercase;
        letter-spacing: 1px;
      ` : `border-bottom: 1px solid #e2e8f0;`}
    }
    
    .party-name {
      font-weight: bold;
      font-size: ${isThermal ? '9px' : '13px'};
      color: ${themeConfig.accent};
      margin-bottom: ${isThermal ? '1px' : '4px'};
    }
    
    .party-detail {
      font-size: ${isThermal ? '8px' : '11px'};
      color: #4a5568;
      margin-bottom: ${isThermal ? '1px' : '2px'};
      line-height: 1.3;
    }
    
    .customer-id {
      background: ${themeConfig.primary};
      color: white;
      padding: ${isThermal ? '1px 4px' : '4px 8px'};
      border-radius: 4px;
      font-size: ${isThermal ? '7px' : '10px'};
      font-weight: 600;
      display: inline-block;
      margin-bottom: ${isThermal ? '2px' : '6px'};
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${isThermal ? '8px' : '10px'};
      margin-bottom: ${isThermal ? '6px' : '20px'};
      ${isThermal ? `
        border-top: 1px solid ${themeConfig.primary};
        border-bottom: 1px solid ${themeConfig.primary};
      ` : theme === 'elegant' ? 'box-shadow: 0 2px 8px rgba(0,0,0,0.1);' : ''}
      ${theme === 'vibrant' && !isThermal ? 'border-radius: 8px; overflow: hidden;' : ''}
    }
    
    .items-table th {
      background: ${isThermal ? 'white' : theme === 'minimal' ? '#f8f9fa' : themeConfig.primary};
      color: ${isThermal ? themeConfig.accent : theme === 'minimal' ? themeConfig.accent : 'white'};
      padding: ${isThermal ? '3px 2px' : '12px 8px'};
      text-align: left;
      font-weight: bold;
      border: ${isThermal ? 'none' : `1px solid ${theme === 'minimal' ? '#cbd5e0' : themeConfig.primary}`};
      border-bottom: ${isThermal ? `1px solid ${themeConfig.primary}` : 'inherit'};
      font-size: ${isThermal ? '8px' : '11px'};
      ${isThermal ? `
        text-transform: uppercase;
        letter-spacing: 0.5px;
      ` : ''}
      ${theme === 'elegant' && !isThermal ? 'font-family: Georgia, serif;' : ''}
    }
    
    .items-table td {
      padding: ${isThermal ? '2px' : '8px'};
      border: ${isThermal ? 'none' : '1px solid #e2e8f0'};
      border-bottom: ${isThermal ? `1px dotted ${themeConfig.primary}` : 'inherit'};
      vertical-align: top;
      font-size: ${isThermal ? '8px' : '10px'};
    }
    
    .items-table tr:nth-child(even) {
      background-color: ${isThermal ? 'white' : themeConfig.secondary};
    }
    
    .items-table tr:hover {
      background-color: ${isThermal ? 'white' : `rgba(${theme === 'modern' ? '37, 99, 235' : theme === 'elegant' ? '124, 58, 237' : '5, 150, 105'}, 0.05)`};
    }
    
    .col-description { width: ${isThermal ? '50%' : '45%'}; }
    .col-quantity { width: ${isThermal ? '15%' : '12%'}; text-align: center; }
    .col-price { width: ${isThermal ? '17%' : '18%'}; text-align: right; }
    .col-total { width: ${isThermal ? '18%' : '18%'}; text-align: right; font-weight: 600; }
    
    .totals-wrapper {
      display: ${isThermal ? 'block' : 'table'};
      width: 100%;
      margin-bottom: ${isThermal ? '6px' : '20px'};
      ${isThermal ? `
        border-top: 2px solid ${themeConfig.primary};
        padding-top: 4px;
      ` : ''}
    }
    
    .totals-spacer {
      display: ${isThermal ? 'none' : 'table-cell'};
      width: 60%;
    }
    
    .totals-section {
      display: ${isThermal ? 'block' : 'table-cell'};
      width: ${isThermal ? '100%' : '40%'};
      vertical-align: top;
      ${isThermal ? '' : theme === 'elegant' ? `
        background: ${themeConfig.secondary};
        padding: 15px;
        border-radius: 8px;
        border: 2px solid ${themeConfig.primary};
      ` : theme === 'warm' ? `
        background: linear-gradient(135deg, ${themeConfig.secondary} 0%, #fef3e2 100%);
        padding: 15px;
        border-radius: 8px;
      ` : ''}
    }
    
    .total-row {
      display: ${isThermal ? 'flex' : 'table'};
      width: 100%;
      margin-bottom: ${isThermal ? '1px' : '4px'};
      ${isThermal ? 'justify-content: space-between;' : ''}
    }
    
    .total-label, .total-value {
      display: ${isThermal ? 'inline' : 'table-cell'};
      padding: ${isThermal ? '1px 0' : '6px 0'};
      font-size: ${isThermal ? '8px' : '12px'};
      color: #4a5568;
    }
    
    .total-label {
      padding-right: ${isThermal ? '4px' : '12px'};
      ${isThermal ? 'font-weight: normal;' : ''}
    }
    
    .total-value {
      text-align: right;
      color: ${themeConfig.accent};
      font-weight: 600;
      ${isThermal ? 'flex-shrink: 0;' : ''}
    }
    
    .grand-total {
      ${isThermal ? `
        border-top: 2px solid ${themeConfig.primary};
        border-bottom: 2px solid ${themeConfig.primary};
        padding: 2px 0 !important;
        margin-top: 2px;
        font-weight: bold;
      ` : theme === 'modern' ? `
        background: ${themeConfig.gradient};
        color: white;
        border-radius: 6px;
        margin-top: 8px;
        padding: 0 12px !important;
      ` : theme === 'vibrant' ? `
        background: ${themeConfig.primary};
        color: white;
        border-radius: 6px;
        margin-top: 8px;
        padding: 0 12px !important;
      ` : `
        border-top: 3px solid ${themeConfig.primary};
        border-bottom: 3px solid ${themeConfig.primary};
        background-color: ${themeConfig.secondary};
        margin-top: 8px;
      `}
    }
    
    .grand-total .total-label,
    .grand-total .total-value {
      font-weight: bold;
      font-size: ${isThermal ? '10px' : '15px'};
      padding: ${isThermal ? '2px 0' : '12px 0'};
      ${isThermal ? `
        color: ${themeConfig.primary};
      ` : theme === 'modern' || theme === 'vibrant' ? 'color: white;' : `color: ${themeConfig.primary};`}
    }
    
    .notes-section {
      margin-bottom: ${isThermal ? '6px' : '25px'};
      page-break-inside: avoid;
      ${isThermal ? `
        border-top: 1px dashed ${themeConfig.primary};
        padding-top: 4px;
      ` : theme === 'elegant' ? `
        background: ${themeConfig.secondary};
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid ${themeConfig.primary};
      ` : ''}
    }
    
    .notes-title {
      font-size: ${isThermal ? '9px' : '14px'};
      font-weight: bold;
      color: ${themeConfig.primary};
      margin-bottom: ${isThermal ? '2px' : '8px'};
      ${isThermal ? 'text-transform: uppercase; letter-spacing: 1px;' : ''}
      ${theme === 'minimal' && !isThermal ? 'text-transform: uppercase; letter-spacing: 1px;' : ''}
    }
    
    .notes-content {
      background-color: ${isThermal ? 'white' : theme === 'elegant' ? 'white' : themeConfig.secondary};
      padding: ${isThermal ? '2px 0' : '12px'};
      border-left: ${isThermal ? 'none' : `4px solid ${themeConfig.primary}`};
      border-radius: ${isThermal ? '0' : '4px'};
      font-size: ${isThermal ? '8px' : '11px'};
      line-height: 1.5;
      color: #4a5568;
      ${theme === 'warm' && !isThermal ? `border: 1px solid ${themeConfig.primary}; border-left-width: 4px;` : ''}
    }
    
    .signature-section {
      display: ${isThermal ? 'block' : 'table'};
      width: 100%;
      margin-top: ${isThermal ? '8px' : '35px'};
      page-break-inside: avoid;
      ${isThermal ? `
        border-top: 1px dashed ${themeConfig.primary};
        padding-top: 4px;
        text-align: center;
      ` : ''}
    }
    
    .signature-business, .signature-customer {
      display: ${isThermal ? 'block' : 'table-cell'};
      width: ${isThermal ? '100%' : '48%'};
      vertical-align: bottom;
      text-align: center;
      ${isThermal ? `
        margin-bottom: 4px;
      ` : theme === 'elegant' ? `
        background: ${themeConfig.secondary};
        padding: 20px;
        border-radius: 8px;
      ` : ''}
    }
    
    .signature-business {
      padding-right: ${isThermal ? '0' : '4%'};
    }
    
    .signature-customer {
      padding-left: ${isThermal ? '0' : '4%'};
    }
    
    .signature-line {
      border-bottom: ${isThermal ? `1px solid ${themeConfig.primary}` : `2px solid ${themeConfig.primary}`};
      height: ${isThermal ? '20px' : '50px'};
      margin-bottom: ${isThermal ? '2px' : '8px'};
      ${theme === 'modern' && !isThermal ? 'border-style: dashed;' : ''}
    }
    
    .signature-image {
      max-width: ${isThermal ? '80px' : '150px'};
      max-height: ${isThermal ? '25px' : '50px'};
      object-fit: contain;
      border: ${isThermal ? `1px solid ${themeConfig.primary}` : `2px solid ${themeConfig.primary}`};
      border-radius: 4px;
      padding: ${isThermal ? '1px' : '4px'};
      margin-bottom: ${isThermal ? '2px' : '8px'};
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    
    .signature-label {
      font-size: ${isThermal ? '7px' : '10px'};
      color: ${themeConfig.primary};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .footer {
      text-align: center;
      margin-top: ${isThermal ? '6px' : '30px'};
      padding-top: ${isThermal ? '4px' : '20px'};
      border-top: ${isThermal ? `1px solid ${themeConfig.primary}` : `2px solid ${themeConfig.primary}`};
      page-break-inside: avoid;
      ${isThermal ? '' : theme === 'warm' ? `
        background: ${themeConfig.secondary};
        padding: 20px;
        border-radius: 8px;
        border-top: 4px solid ${themeConfig.primary};
      ` : ''}
    }
    
    .footer-thank-you {
      font-weight: bold;
      font-size: ${isThermal ? '9px' : '14px'};
      color: ${themeConfig.primary};
      margin-bottom: ${isThermal ? '2px' : '6px'};
      ${isThermal ? 'text-transform: uppercase; letter-spacing: 1px;' : ''}
      ${theme === 'elegant' && !isThermal ? 'font-family: Georgia, serif;' : ''}
    }
    
    .footer-info {
      font-size: ${isThermal ? '7px' : '10px'};
      color: #718096;
    }
    
    .footer-ref {
      font-weight: 600;
      color: ${themeConfig.accent};
      margin-top: ${isThermal ? '1px' : '4px'};
    }
    
    /* Thermal receipt specific styles */
    ${isThermal ? `
      .thermal-divider {
        text-align: center;
        margin: 4px 0;
        font-size: 12px;
        font-weight: bold;
      }
      
      .thermal-divider::before,
      .thermal-divider::after {
        content: '====';
        margin: 0 4px;
      }
    ` : ''}
    
    @media print {
      body {
        font-size: ${isThermal ? '8px' : '10px'};
        margin: 0;
        padding: 0;
        ${isThermal ? 'width: 80mm;' : ''}
      }
      
      .page-container {
        max-width: none;
        width: 100%;
      }
      
      .no-print {
        display: none !important;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .avoid-break {
        page-break-inside: avoid;
      }
      
      /* Ensure logo visibility in print */
      .business-logo {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    .items-table tbody tr {
      page-break-inside: avoid;
    }
    
    .items-table thead {
      display: table-header-group;
    }
  `;
};

 

// Generate HTML content for PDF with theme support
const generateHtmlContent = async (invoiceData, theme = 'modern') => {
  const {
    documentType = 'Invoice',
    invoiceNumber = '',
    date = new Date().toLocaleDateString(),
    businessInfo = {},
    customerInfo = {},
    items = [],
    TaxRate = 0,
    discountRate = 0,
    notes = '',
    businessLogo,
    customerSignature,
    subtotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    currency = 'USD'
  } = invoiceData;

  const currentDate = new Date();
  const generatedDate = currentDate.toLocaleDateString();
  const generatedTime = currentDate.toLocaleTimeString();
  const generatedDateTime = currentDate.toLocaleString();
  
  const customerName = customerInfo.name || 'Customer';
  const customerInitials = customerName.split(' ').map(name => name.charAt(0)).join('').toUpperCase();
  const enhancedInvoiceNumber = invoiceNumber || `${documentType.toUpperCase()}-${customerInitials}-${Date.now()}`;

  const [businessLogoBase64, customerSignatureBase64] = await Promise.all([
    businessLogo ? convertImageToBase64(businessLogo) : null,
    customerSignature ? convertImageToBase64(customerSignature) : null
  ]);

  const isThermalTheme = (INVOICE_THEMES[theme]?.type === 'thermal');
  const formatCurrencyValue = (amount) => {
    const num = Number(amount || 0);
    if (isThermalTheme) {
      const curr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
      // Many thermal printers lack Unicode glyphs for symbols. Use currency code to ensure visibility.
      return `${curr.code} ${num.toFixed(2)}`;
    }
    return formatCurrency(num, currency);
  };

  const itemsHtml = items.map(item => {
    const itemTotal = (parseFloat(item.quantity || 0) * parseFloat(item.price || 0));
    return `
      <tr>
        <td class="col-description">${sanitizeText(item.description)}</td>
        <td class="col-quantity">${sanitizeText(item.quantity)}</td>
        <td class="col-price">${formatCurrencyValue(parseFloat(item.price || 0))}</td>
        <td class="col-total">${formatCurrencyValue(itemTotal)}</td>
      </tr>
    `;
  }).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sanitizeText(documentType.toUpperCase())} ${sanitizeText(invoiceNumber)}</title>
    <style>${getCSS(theme)}</style>
  </head>
  <body>
    <div class="page-container">
      <div class="header avoid-break">
        <div class="header-left">
          ${businessLogoBase64 ? `<img src="${businessLogoBase64}" alt="Business Logo" class="business-logo">` : ''}
          <div class="business-name">${sanitizeText(businessInfo.name || '')}</div>
        </div>
        <div class="header-right">
          <div class="document-title">${sanitizeText(documentType.toUpperCase())}</div>
          <div class="document-number">${sanitizeText(enhancedInvoiceNumber)}</div>
          <div class="document-date">Issue Date: ${sanitizeText(date)}</div>
          <div class="document-generated">Generated: ${sanitizeText(generatedDateTime)}</div>
        </div>
      </div>
      
      <div class="party-info avoid-break">
        <div class="party-from">
          <div class="party-title">From:</div>
          <div class="party-name">${sanitizeText(businessInfo.name || '')}</div>
          ${businessInfo.address ? `<div class="party-detail">${sanitizeText(businessInfo.address)}</div>` : ''}
          ${businessInfo.phone ? `<div class="party-detail">Phone: ${sanitizeText(businessInfo.phone)}</div>` : ''}
          ${businessInfo.email ? `<div class="party-detail">Email: ${sanitizeText(businessInfo.email)}</div>` : ''}
          ${businessInfo.taxId ? `<div class="party-detail">Tax ID: ${sanitizeText(businessInfo.taxId)}</div>` : ''}
        </div>
        
        <div class="party-to">
          <div class="party-title">To:</div>
          <div class="party-name">${sanitizeText(customerInfo.name || '')}</div>
          <div class="party-detail customer-id">Customer ID: ${sanitizeText(customerInitials)}-${Date.now().toString().slice(-6)}</div>
          ${customerInfo.address ? `<div class="party-detail">${sanitizeText(customerInfo.address)}</div>` : ''}
          ${customerInfo.phone ? `<div class="party-detail">Phone: ${sanitizeText(customerInfo.phone)}</div>` : ''}
          ${customerInfo.email ? `<div class="party-detail">Email: ${sanitizeText(customerInfo.email)}</div>` : ''}
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-description">Description</th>
            <th class="col-quantity">Qty</th>
            <th class="col-price">Unit Price</th>
            <th class="col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="totals-wrapper">
        <div class="totals-spacer"></div>
        <div class="totals-section">
          <div class="total-row">
            <div class="total-label">Subtotal:</div>
            <div class="total-value">${formatCurrencyValue(subtotal)}</div>
          </div>
          ${discount > 0 ? `
          <div class="total-row">
            <div class="total-label">Discount (${discountRate}%):</div>
            <div class="total-value">-${formatCurrencyValue(discount)}</div>
          </div>
          ` : ''}
          <div class="total-row">
            <div class="total-label">Tax (${TaxRate}%):</div>
            <div class="total-value">${formatCurrencyValue(tax)}</div>
          </div>
          <div class="total-row grand-total">
            <div class="total-label">TOTAL:</div>
            <div class="total-value">${formatCurrencyValue(total)}</div>
          </div>
        </div>
      </div>
      
      ${notes ? `
        <div class="notes-section avoid-break">
          <div class="notes-title">Notes:</div>
          <div class="notes-content">${sanitizeText(notes)}</div>
        </div>
      ` : ''}
      
      <div class="signature-section avoid-break">
        <div class="signature-business">
          <div class="signature-line"></div>
          <div class="signature-label">Customer Signature</div>
        </div>
        
        <div class="signature-customer">
          ${customerSignatureBase64 ? 
            `<img src="${customerSignatureBase64}" alt="Business Signature" class="signature-image">` : 
            `<div class="signature-line"></div>`
          }
          <div class="signature-label">Business Signature</div>
        </div>
      </div>
      
      <div class="footer avoid-break">
        <div class="footer-thank-you">Thank you for doing business with us!</div>
        <div class="footer-info">
          <div>Generated on ${generatedDate} at ${generatedTime}</div>
          <div class="footer-ref">Reference: ${sanitizeText(enhancedInvoiceNumber)}</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Enhanced PDF generation function with theme support
export const generateInvoicePdf = async (invoiceData, theme = 'modern') => {
  try {
    if (!invoiceData) {
      throw new Error('Invoice data is required');
    }

    const htmlContent = await generateHtmlContent(invoiceData, theme);
    
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      width: PDF_CONFIG.width,
      height: PDF_CONFIG.height
    });
    
    const timestamp = Date.now();
    const customerName = invoiceData.customerInfo?.name || 'Customer';
    const customerInitials = customerName.split(' ').map(name => name.charAt(0)).join('').toUpperCase();
    const enhancedInvoiceNumber = invoiceData.invoiceNumber || `${invoiceData.documentType || 'DOC'}-${customerInitials}-${timestamp}`;
    
    const filename = `${enhancedInvoiceNumber}_${theme}_${new Date().toISOString().split('T')[0]}.pdf`;
    const permanentUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.moveAsync({
      from: uri,
      to: permanentUri
    });

    console.log('PDF generated successfully at:', permanentUri);
    return permanentUri;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

// Theme Selector Component
const ThemeSelector = ({ selectedTheme, onThemeChange, visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.themeModalContainer}>
        <View style={styles.themeHeader}>
          <Text style={styles.themeHeaderTitle}>Choose Invoice Theme</Text>
          <TouchableOpacity onPress={onClose} style={styles.themeCloseButton}>
            <Feather name="x" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.themeScrollContainer}>
          {Object.entries(INVOICE_THEMES).map(([key, theme]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.themeOption,
                selectedTheme === key && styles.themeOptionSelected,
                { borderColor: theme.primary }
              ]}
              onPress={() => {
                onThemeChange(key);
                onClose();
              }}
            >
              <View style={styles.themePreview}>
                <View style={[styles.themeColorBar, { backgroundColor: theme.primary }]} />
                <View style={styles.themeInfo}>
                  <Text style={styles.themeOptionName}>{theme.name}</Text>
                  <Text style={styles.themeOptionDescription}>
                    {key === 'modern' ? 'Clean and professional with blue accents' :
                     key === 'elegant' ? 'Sophisticated purple design with serif fonts' :
                     key === 'corporate' ? 'Traditional gray business theme' :
                     key === 'vibrant' ? 'Fresh green theme with modern styling' :
                     key === 'warm' ? 'Friendly orange design with rounded elements' :
                     'Minimalist black and white design'}
                  </Text>
                </View>
              </View>
              {selectedTheme === key && (
                <Feather name="check-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Main PrintPdf Component with Enhanced Features
export const PrintPdf = ({ 
  visible, 
  onClose, 
  invoiceData, 
  showToast,
  onError 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUri, setPdfUri] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('modern');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Memoized currency formatter
  const currencyFormatter = useMemo(() => {
    return (amount) => formatCurrency(amount, invoiceData?.currency || 'USD');
  }, [invoiceData?.currency]);

  // Generate PDF with selected theme
  const generatePDF = useCallback(async (theme = selectedTheme) => {
    if (!invoiceData) {
      showToast?.('Invoice data is missing', 'error');
      return null;
    }

    try {
      setIsGenerating(true);
      const uri = await generateInvoicePdf(invoiceData, theme);
      setPdfUri(uri);
      showToast?.(`PDF generated with ${INVOICE_THEMES[theme].name} theme!`, 'success');
      return uri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error.message || 'Failed to generate PDF';
      showToast?.(errorMessage, 'error');
      onError?.(error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [invoiceData, selectedTheme, showToast, onError]);

  // Handle theme change
  const handleThemeChange = useCallback((theme) => {
    setSelectedTheme(theme);
    setPdfUri(null); // Reset PDF URI to force regeneration
  }, []);

  // Handle actions
  const handlePrint = useCallback(async () => {
    try {
      const htmlContent = await generateHtmlContent(invoiceData, selectedTheme);
      
      let selectedPrinter = undefined;
      if (Platform.OS === 'ios') {
        try {
          selectedPrinter = await Print.selectPrinterAsync();
        } catch (printerError) {
          console.log('Printer selection cancelled or unavailable');
        }
      }
      
      await Print.printAsync({
        html: htmlContent,
        printerUrl: selectedPrinter?.url
      });
      
      showToast?.('Document sent to printer', 'success');
    } catch (error) {
      console.error('Print error:', error);
      const errorMessage = error.message?.includes('not available') 
        ? 'Printing is not available on this device' 
        : 'Failed to print document';
      showToast?.(errorMessage, 'error');
    }
  }, [invoiceData, selectedTheme, showToast]);

  const handleShare = useCallback(async () => {
    try {
      let uri = pdfUri;
      
      if (!uri) {
        uri = await generatePDF();
        if (!uri) return;
      }
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showToast?.('Sharing not available on this device', 'error');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${invoiceData?.documentType || 'Document'} ${invoiceData?.invoiceNumber || ''}`
      });
    } catch (error) {
      console.error('Share error:', error);
      showToast?.('Failed to share PDF', 'error');
    }
  }, [pdfUri, generatePDF, invoiceData, showToast]);

  const handleSave = useCallback(async () => {
    try {
      let uri = pdfUri;
      
      if (!uri) {
        uri = await generatePDF();
        if (!uri) return;
      }
      
      showToast?.('PDF saved successfully', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showToast?.('Failed to save PDF', 'error');
    }
  }, [pdfUri, generatePDF, showToast]);

  // Enhanced email function with PDF sharing options
  const handleEmail = useCallback(async () => {
    try {
      let uri = pdfUri;
      if (!uri) {
        uri = await generatePDF();
        if (!uri) return;
      }

      const customerEmail = invoiceData?.customerInfo?.email;
      if (!customerEmail) {
        // If no customer email, show sharing options
        Alert.alert(
          'Email Options',
          'Customer email not available. Choose an option:',
          [
            {
              text: 'Share PDF',
              onPress: async () => {
                try {
                  const isAvailable = await Sharing.isAvailableAsync();
                  if (isAvailable) {
                    await Sharing.shareAsync(uri, {
                      mimeType: 'application/pdf',
                      dialogTitle: 'Share Invoice PDF via Email'
                    });
                  } else {
                    showToast?.('Sharing not available', 'error');
                  }
                } catch (error) {
                  showToast?.('Failed to share PDF', 'error');
                }
              }
            },
            {
              text: 'Open Email App',
              onPress: async () => {
                try {
                  const subject = `${(invoiceData?.documentType || 'Document').toUpperCase()} ${invoiceData?.invoiceNumber || ''}`;
                  const body = `Please find attached your ${invoiceData?.documentType?.toLowerCase() || 'document'}.

Thank you for your business!

Best regards,
${invoiceData?.businessInfo?.name || 'Your Business'}

---
Note: Please attach the PDF file manually from your device storage.
File name: ${uri.split('/').pop()}`;

                  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  
                  const canOpen = await Linking.canOpenURL(mailtoLink);
                  if (canOpen) {
                    await Linking.openURL(mailtoLink);
                    showToast?.('Email app opened. Please attach PDF manually.', 'info');
                  } else {
                    showToast?.('Email app not available', 'error');
                  }
                } catch (error) {
                  showToast?.('Failed to open email app', 'error');
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Customer email available - show options
      Alert.alert(
        'Send Invoice',
        `Send to: ${customerEmail}`,
        [
          {
            text: 'Share PDF',
            onPress: async () => {
              try {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share Invoice to ${customerEmail}`
                  });
                  showToast?.('PDF shared successfully', 'success');
                } else {
                  showToast?.('Sharing not available', 'error');
                }
              } catch (error) {
                showToast?.('Failed to share PDF', 'error');
              }
            }
          },
          {
            text: 'Open Email App',
            onPress: async () => {
              try {
                const subject = `${(invoiceData?.documentType || 'Document').toUpperCase()} ${invoiceData?.invoiceNumber || ''}`;
                const body = `Dear ${invoiceData?.customerInfo?.name || 'Customer'},

Please find attached your ${invoiceData?.documentType?.toLowerCase() || 'document'} ${invoiceData?.invoiceNumber || ''}.

Invoice Details:
- Amount: ${formatCurrency(invoiceData.total || 0, invoiceData.currency || 'USD')}
- Date: ${invoiceData.date || new Date().toLocaleDateString()}

Thank you for your business!

Best regards,
${invoiceData?.businessInfo?.name || 'Your Business'}
${invoiceData?.businessInfo?.email ? `Email: ${invoiceData.businessInfo.email}` : ''}
${invoiceData?.businessInfo?.phone ? `Phone: ${invoiceData.businessInfo.phone}` : ''}

---
Note: Please attach the PDF file manually from your device storage.
File location: ${uri}`;

                const mailtoLink = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                
                const canOpen = await Linking.canOpenURL(mailtoLink);
                if (canOpen) {
                  await Linking.openURL(mailtoLink);
                  showToast?.('Email app opened with pre-filled content', 'success');
                } else {
                  showToast?.('Email app not available', 'error');
                }
              } catch (error) {
                console.error('Email error:', error);
                showToast?.('Failed to open email app', 'error');
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Email handler error:', error);
      showToast?.('Failed to process email request', 'error');
    }
  }, [pdfUri, generatePDF, invoiceData, showToast]);

  // Action buttons configuration
  const actionButtons = useMemo(() => [
    {
      icon: 'eye',
      label: 'Theme',
      color: '#8b5cf6',
      onPress: () => setShowThemeSelector(true),
      disabled: isGenerating
    },
    {
      icon: 'printer',
      label: 'Print',
      color: '#059669',
      onPress: handlePrint,
      disabled: isGenerating
    },
    {
      icon: 'share',
      label: 'Share',
      color: '#2563eb',
      onPress: handleShare,
      disabled: isGenerating
    },
    {
      icon: 'download',
      label: 'Save',
      color: '#ea580c',
      onPress: handleSave,
      disabled: isGenerating
    },
    {
      icon: 'mail',
      label: 'Email',
      color: '#7c3aed',
      onPress: handleEmail,
      disabled: isGenerating
    }
  ], [handlePrint, handleShare, handleSave, handleEmail, isGenerating]);

  if (!invoiceData) {
    return null;
  }

  const currentTheme = INVOICE_THEMES[selectedTheme];

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: currentTheme.primary }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.closeButton}
                disabled={isGenerating}
              >
                <Feather name="x" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {(invoiceData.documentType || 'Document').toUpperCase()} Preview
              </Text>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.themeIndicator, { backgroundColor: currentTheme.primary }]}>
                <Text style={styles.themeIndicatorText}>{currentTheme.name}</Text>
              </View>
              {isGenerating && (
                <ActivityIndicator size="small" color={currentTheme.primary} style={styles.loadingIndicator} />
              )}
            </View>
          </View>

          {/* PDF Preview Content */}
          <ScrollView style={styles.previewContainer}>
            <View style={[styles.previewContent, { borderColor: currentTheme.primary }]}>
              {/* Document Header with Theme Preview */}
              <View style={[styles.documentHeader, { 
                backgroundColor: selectedTheme === 'modern' || selectedTheme === 'vibrant' ? currentTheme.primary : currentTheme.secondary,
                borderColor: currentTheme.primary 
              }]}>
                <View style={styles.logoSection}>
                  {invoiceData.businessLogo && (
                    <Image 
                      source={{ uri: invoiceData.businessLogo }} 
                      style={styles.businessLogo}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={[styles.businessName, { 
                    color: selectedTheme === 'modern' || selectedTheme === 'vibrant' ? 'white' : currentTheme.primary 
                  }]}>
                    {invoiceData.businessInfo?.name || ''}
                  </Text>
                </View>
                <View style={styles.documentInfo}>
                  <Text style={[styles.documentTitle, { 
                    color: selectedTheme === 'modern' || selectedTheme === 'vibrant' ? 'white' : currentTheme.primary 
                  }]}>
                    {(invoiceData.documentType || 'Document').toUpperCase()}
                  </Text>
                  <Text style={[styles.documentNumber, { 
                    color: selectedTheme === 'modern' || selectedTheme === 'vibrant' ? 'rgba(255,255,255,0.9)' : '#6b7280'
                  }]}>
                    {invoiceData.invoiceNumber || ''}
                  </Text>
                  <Text style={[styles.documentDate, { 
                    color: selectedTheme === 'modern' || selectedTheme === 'vibrant' ? 'rgba(255,255,255,0.8)' : '#6b7280'
                  }]}>
                    Date: {invoiceData.date || new Date().toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Party Information */}
              <View style={styles.partyInfo}>
                <View style={[styles.partySection, selectedTheme === 'elegant' && { backgroundColor: currentTheme.secondary }]}>
                  <Text style={[styles.partyTitle, { color: currentTheme.primary }]}>From:</Text>
                  <Text style={styles.partyName}>
                    {invoiceData.businessInfo?.name || ''}
                  </Text>
                  {invoiceData.businessInfo?.address && (
                    <Text style={styles.partyDetail}>
                      {invoiceData.businessInfo.address}
                    </Text>
                  )}
                  {invoiceData.businessInfo?.phone && (
                    <Text style={styles.partyDetail}>
                      Phone: {invoiceData.businessInfo.phone}
                    </Text>
                  )}
                  {invoiceData.businessInfo?.email && (
                    <Text style={styles.partyDetail}>
                      Email: {invoiceData.businessInfo.email}
                    </Text>
                  )}
                </View>
                
                <View style={[styles.partySection, selectedTheme === 'elegant' && { backgroundColor: currentTheme.secondary }]}>
                  <Text style={[styles.partyTitle, { color: currentTheme.primary }]}>To:</Text>
                  <Text style={styles.partyName}>
                    {invoiceData.customerInfo?.name || ''}
                  </Text>
                  <View style={[styles.customerIdBadge, { backgroundColor: currentTheme.primary }]}>
                    <Text style={styles.customerIdText}>
                      Customer ID: {(() => {
                        const customerName = invoiceData.customerInfo?.name || 'Customer';
                        const customerInitials = customerName.split(' ').map(name => name.charAt(0)).join('').toUpperCase();
                        return `${customerInitials}-${Date.now().toString().slice(-6)}`;
                      })()}
                    </Text>
                  </View>
                  {invoiceData.customerInfo?.address && (
                    <Text style={styles.partyDetail}>
                      {invoiceData.customerInfo.address}
                    </Text>
                  )}
                  {invoiceData.customerInfo?.phone && (
                    <Text style={styles.partyDetail}>
                      Phone: {invoiceData.customerInfo.phone}
                    </Text>
                  )}
                  {invoiceData.customerInfo?.email && (
                    <Text style={styles.partyDetail}>
                      Email: {invoiceData.customerInfo.email}
                    </Text>
                  )}
                </View>
              </View>

              {/* Items Table */}
              <View style={styles.itemsTable}>
                <View style={[styles.tableHeader, { backgroundColor: currentTheme.primary }]}>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Total</Text>
                </View>
                
                {(invoiceData.items || []).map((item, index) => {
                  const itemTotal = (parseFloat(item.quantity || 0) * parseFloat(item.price || 0));
                  return (
                    <View key={index} style={[
                      styles.tableRow,
                      index % 2 === 1 && { backgroundColor: currentTheme.secondary }
                    ]}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>
                        {item.description || ''}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                        {item.quantity || ''}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                        {currencyFormatter(parseFloat(item.price || 0))}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: '600' }]}>
                        {currencyFormatter(itemTotal)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Totals */}
              <View style={styles.totalsSection}>
                <View style={[styles.totalsContainer, selectedTheme === 'elegant' && {
                  backgroundColor: currentTheme.secondary,
                  borderColor: currentTheme.primary
                }]}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>
                      {currencyFormatter(invoiceData.subtotal || 0)}
                    </Text>
                  </View>
                  {invoiceData.discount > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>
                        Discount ({invoiceData.discountRate || 0}%):
                      </Text>
                      <Text style={[styles.totalValue, { color: '#ef4444' }]}>
                        -{currencyFormatter(invoiceData.discount || 0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      Tax ({invoiceData.TaxRate || 0}%):
                    </Text>
                    <Text style={styles.totalValue}>
                      {currencyFormatter(invoiceData.tax || 0)}
                    </Text>
                  </View>
                  <View style={[
                    styles.totalRow, 
                    styles.grandTotal, 
                    { 
                      backgroundColor: selectedTheme === 'modern' || selectedTheme === 'vibrant' ? currentTheme.primary : currentTheme.secondary,
                      borderColor: currentTheme.primary 
                    }
                  ]}>
                    <Text style={[styles.grandTotalLabel, { 
                      color: selectedTheme === 'modern' || selectedTheme === 'vibrant' ? 'white' : currentTheme.primary 
                    }]}>TOTAL:</Text>
                    <Text style={[styles.grandTotalValue, { 
                      color: selectedTheme === 'modern' || selectedTheme === 'vibrant' ? 'white' : currentTheme.primary 
                    }]}>
                      {currencyFormatter(invoiceData.total || 0)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Notes */}
              {invoiceData.notes && (
                <View style={[
                  styles.notesSection,
                  selectedTheme === 'elegant' && { backgroundColor: currentTheme.secondary }
                ]}>
                  <Text style={[styles.notesTitle, { color: currentTheme.primary }]}>Notes:</Text>
                  <Text style={[styles.notesContent, { 
                    backgroundColor: selectedTheme === 'elegant' ? 'white' : currentTheme.secondary,
                    borderLeftColor: currentTheme.primary 
                  }]}>{invoiceData.notes}</Text>
                </View>
              )}

              {/* Signature */}
              {invoiceData.customerSignature && (
                <View style={styles.signatureSection}>
                  <Text style={[styles.signatureTitle, { color: currentTheme.primary }]}>Business Signature:</Text>
                  <Image 
                    source={{ uri: invoiceData.customerSignature }} 
                    style={[styles.signatureImage, { borderColor: currentTheme.primary }]}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionBar, { borderTopColor: currentTheme.primary + '20' }]}>
            {actionButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton, 
                  { backgroundColor: button.color },
                  button.disabled && styles.actionButtonDisabled
                ]}
                onPress={button.onPress}
                disabled={button.disabled}
              >
                <Feather name={button.icon} size={16} color="white" />
                <Text style={styles.actionButtonText}>{button.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Theme Selector Modal */}
      <ThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        selectedTheme={selectedTheme}
        onThemeChange={handleThemeChange}
      />
    </>
  );
};

// Enhanced StyleSheet with theme support
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
    backgroundColor: '#f9fafb'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151'
  },
  themeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12
  },
  themeIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  loadingIndicator: {
    marginLeft: 8
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  previewContent: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1
  },
  logoSection: {
    flex: 1
  },
  businessLogo: {
    width: 100,
    height: 60,
    marginBottom: 8
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  documentInfo: {
    alignItems: 'flex-end'
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  documentNumber: {
    fontSize: 16,
    marginBottom: 4
  },
  documentDate: {
    fontSize: 14,
    marginBottom: 4
  },
  partyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  partySection: {
    flex: 1,
    marginRight: 16,
    padding: 12,
    borderRadius: 6
  },
  partyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4
  },
  partyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4
  },
  partyDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2
  },
  customerIdBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  customerIdText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '500'
  },
  itemsTable: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  tableCell: {
    fontSize: 12,
    color: '#374151'
  },
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 24
  },
  totalsContainer: {
    width: width * 0.6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  totalLabel: {
    fontSize: 14,
    color: '#374151'
  },
  totalValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500'
  },
  grandTotal: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 2
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  notesSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  notesContent: {
    fontSize: 12,
    color: '#374151',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4
  },
  signatureSection: {
    marginTop: 32,
    alignItems: 'center'
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  signatureImage: {
    width: 150,
    height: 50,
    borderWidth: 2,
    borderRadius: 4
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 2
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    minHeight: 44
  },
  actionButtonDisabled: {
    opacity: 0.5
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 12
  },
  // Theme Selector Styles
  themeModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb'
  },
  themeHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151'
  },
  themeCloseButton: {
    padding: 8
  },
  themeScrollContainer: {
    flex: 1,
    padding: 16
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#ffffff'
  },
  themeOptionSelected: {
    backgroundColor: '#f0f7ff',
    borderWidth: 2
  },
  themePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  themeColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12
  },
  themeInfo: {
    flex: 1
  },
  themeOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4
  },
  themeOptionDescription: {
    fontSize: 12,
    color: '#6b7280'
  }
};