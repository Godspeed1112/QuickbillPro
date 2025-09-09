// components/InventoryManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, darkStyles } from 'components/Styles/MainAppStyles';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

// Currency formatting will be handled by the parent component

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

// Default categories for products
const DEFAULT_PRODUCT_CATEGORIES = [
  'General',
  'Electronics',
  'Clothing',
  'Food & Beverage',
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Health',
  'Books & Media',
  'Automotive',
  'Services',
  'Other'
];

// Global database instance
let dbInstance = null;

// Improved database initialization with better error handling and retry logic
const initializeDatabase = async (retryCount = 0) => {
  const MAX_RETRIES = 3;
  
  try {
    console.log(`Initializing database... (attempt ${retryCount + 1})`);
    
    // Return existing instance if available
    if (dbInstance) {
      console.log('Using existing database instance');
      return dbInstance;
    }
    
    // Clear any existing database on first retry
    if (retryCount > 0) {
      console.log('Clearing database cache...');
      try {
        await FileSystem.deleteAsync(`${FileSystem.documentDirectory}SQLite/inventory_app.db`, { idempotent: true });
      } catch (clearError) {
        console.log('Database clear attempt - file may not exist');
      }
    }
    
    // Open database with timeout
    const dbPromise = SQLite.openDatabaseAsync('inventory_app.db');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database open timeout')), 10000);
    });
    
    const db = await Promise.race([dbPromise, timeoutPromise]);
    
    if (!db) {
      throw new Error('Failed to open database - null instance');
    }
    
    console.log('Database opened successfully');
    
    // Test database connection with timeout
    const testPromise = db.getFirstAsync('SELECT 1 as test');
    const testTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database test timeout')), 5000);
    });
    
    const testResult = await Promise.race([testPromise, testTimeoutPromise]);
    
    if (!testResult || testResult.test !== 1) {
      throw new Error('Database connection test failed');
    }
    
    console.log('Database connection test successful');
    
    // Create tables with better error handling
    await createTables(db);
    
    // Cache the working database instance
    dbInstance = db;
    console.log('Database initialization completed successfully');
    return db;
    
  } catch (error) {
    console.error(`Database initialization error (attempt ${retryCount + 1}):`, error);
    
    // Clear cached instance on error
    dbInstance = null;
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying database initialization... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return initializeDatabase(retryCount + 1);
    }
    
    throw new Error(`Database initialization failed after ${MAX_RETRIES + 1} attempts: ${error.message}`);
  }
};

// Separate function to create tables
const createTables = async (db) => {
  try {
    console.log('Creating database tables...');
    
    // Create products table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        price TEXT NOT NULL DEFAULT '0',
        category TEXT DEFAULT 'General',
        stock TEXT DEFAULT '0',
        sku TEXT DEFAULT '',
        createdAt INTEGER DEFAULT 0,
        updatedAt INTEGER DEFAULT 0
      );
    `);
    
    // Create categories table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      );
    `);
    
    // Create indexes for better performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updatedAt);
    `);
    
    console.log('Database tables and indexes created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw new Error(`Table creation failed: ${error.message}`);
  }
};

// Database operation wrapper with fallback
const withDatabaseFallback = async (operation, fallbackOperation) => {
  try {
    const db = await initializeDatabase();
    return await operation(db);
  } catch (error) {
    console.error('Database operation failed, using fallback:', error);
    return await fallbackOperation();
  }
};

// CSV Import Modal Component
const CSVImportModal = ({ visible, onClose, onImport, isDarkMode }) => {
  const [importData, setImportData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile(file);
        await processCSVFile(file);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const processCSVFile = async (file) => {
    setIsProcessing(true);
    try {
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing errors:', results.errors);
          }

          const processedData = results.data.map((row, index) => {
            // Clean headers and normalize common field names
            const cleanRow = {};
            Object.keys(row).forEach(key => {
              const cleanKey = key.trim().toLowerCase();
              cleanRow[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
            });

            return {
              originalIndex: index,
              name: cleanRow.name || cleanRow.product_name || cleanRow['product name'] || cleanRow.title || '',
              description: cleanRow.description || cleanRow.desc || cleanRow.details || '',
              price: cleanRow.price || cleanRow.cost || cleanRow.amount || '0',
              category: cleanRow.category || cleanRow.type || cleanRow.group || 'General',
              stock: cleanRow.stock || cleanRow.quantity || cleanRow.qty || cleanRow.inventory || '0',
              sku: cleanRow.sku || cleanRow.code || cleanRow['product code'] || cleanRow.id || '',
              valid: true,
              errors: []
            };
          });

          // Validate and filter data
          const validatedData = processedData.map(item => {
            const errors = [];
            
            if (!item.name) {
              errors.push('Missing product name');
              item.valid = false;
            }
            
            if (!item.price || isNaN(parseFloat(item.price))) {
              errors.push('Invalid price');
              item.valid = false;
            }
            
            if (!item.stock || isNaN(parseInt(item.stock))) {
              item.stock = '0';
            }

            item.errors = errors;
            return item;
          });

          setImportData(validatedData);
          setPreviewData(validatedData.slice(0, 5)); // Show first 5 items for preview
          setIsProcessing(false);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          Alert.alert('Error', 'Failed to parse CSV file. Please check the file format.');
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error('Error reading file:', error);
      Alert.alert('Error', 'Failed to read file. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    const validItems = importData.filter(item => item.valid);
    
    if (validItems.length === 0) {
      Alert.alert('No Valid Items', 'No valid products found to import.');
      return;
    }

    const products = validItems.map(item => ({
      id: Date.now().toString() + Math.random().toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      stock: item.stock,
      sku: item.sku,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));

    onImport(products);
    handleClose();
  };

  const handleClose = () => {
    setImportData([]);
    setSelectedFile(null);
    setPreviewData([]);
    setIsProcessing(false);
    onClose();
  };

  const validCount = importData.filter(item => item.valid).length;
  const invalidCount = importData.length - validCount;

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
            <Text style={[currentStyles.sectionTitleText, { fontSize: 18 }]}>
              Import Products from CSV
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!selectedFile ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Feather name="upload" size={48} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Text style={{
                  fontSize: 16,
                  color: isDarkMode ? '#d1d5db' : '#6b7280',
                  textAlign: 'center',
                  marginVertical: 16
                }}>
                  Select a CSV file to import products
                </Text>
                
                <TouchableOpacity
                  style={[currentStyles.actionButton, { backgroundColor: '#2563eb' }]}
                  onPress={handlePickFile}
                >
                  <Feather name="file-text" size={16} color="white" />
                  <Text style={currentStyles.actionButtonText}>Choose CSV File</Text>
                </TouchableOpacity>

                <View style={{ marginTop: 24, padding: 16, backgroundColor: isDarkMode ? '#4b5563' : '#f9fafb', borderRadius: 8 }}>
                  <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#f3f4f6' : '#1f2937', marginBottom: 8 }}>
                    📋 CSV Format Guidelines:
                  </Text>
                  <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', fontSize: 12, lineHeight: 16 }}>
                    • Required: name, price{'\n'}
                    • Optional: description, category, stock, sku{'\n'}
                    • First row should contain column headers{'\n'}
                    • Use common names like "Product Name", "Price", "Stock", etc.
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16
                }}>
                  <Feather name="file-text" size={20} color={isDarkMode ? '#d1d5db' : '#6b7280'} />
                  <Text style={{
                    marginLeft: 8,
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    fontWeight: '500',
                    flex: 1
                  }}>
                    {selectedFile.name}
                  </Text>
                  {isProcessing && <Text style={{ color: '#059669', fontSize: 12 }}>Processing...</Text>}
                </View>

                {importData.length > 0 && (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#059669' }}>
                          {validCount}
                        </Text>
                        <Text style={{ fontSize: 12, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                          Valid
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ef4444' }}>
                          {invalidCount}
                        </Text>
                        <Text style={{ fontSize: 12, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                          Invalid
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563eb' }}>
                          {importData.length}
                        </Text>
                        <Text style={{ fontSize: 12, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                          Total
                        </Text>
                      </View>
                    </View>

                    <Text style={{
                      fontWeight: 'bold',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      marginBottom: 12
                    }}>
                      Preview (First 5 items):
                    </Text>

                    {previewData.map((item, index) => (
                      <View
                        key={index}
                        style={{
                          padding: 12,
                          backgroundColor: item.valid 
                            ? (isDarkMode ? '#065f46' : '#d1fae5')
                            : (isDarkMode ? '#7f1d1d' : '#fee2e2'),
                          borderRadius: 8,
                          marginBottom: 8
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Feather 
                            name={item.valid ? 'check-circle' : 'x-circle'} 
                            size={16} 
                            color={item.valid ? '#059669' : '#ef4444'} 
                          />
                          <Text style={{
                            marginLeft: 8,
                            fontWeight: 'bold',
                            color: item.valid ? '#065f46' : '#7f1d1d',
                            flex: 1
                          }}>
                            {item.name || 'Unnamed Product'}
                          </Text>
                        </View>
                        <Text style={{
                          fontSize: 12,
                          color: item.valid ? '#047857' : '#dc2626'
                        }}>
                          Price: {formatCurrency(parseFloat(item.price || 0))} | Stock: {item.stock} | Category: {item.category}
                        </Text>
                        {item.errors.length > 0 && (
                          <Text style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>
                            Issues: {item.errors.join(', ')}
                          </Text>
                        )}
                      </View>
                    ))}

                    {importData.length > 5 && (
                      <Text style={{
                        textAlign: 'center',
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        fontSize: 12,
                        marginTop: 8
                      }}>
                        ... and {importData.length - 5} more items
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
            <TouchableOpacity
              style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#6b7280' }]}
              onPress={handleClose}
            >
              <Text style={currentStyles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            {selectedFile && (
              <TouchableOpacity
                style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#2563eb' }]}
                onPress={handlePickFile}
              >
                <Feather name="refresh-cw" size={16} color="white" />
                <Text style={currentStyles.actionButtonText}>Choose Different File</Text>
              </TouchableOpacity>
            )}
            
            {importData.length > 0 && validCount > 0 && (
              <TouchableOpacity
                style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#059669' }]}
                onPress={handleImport}
              >
                <Feather name="download" size={16} color="white" />
                <Text style={currentStyles.actionButtonText}>
                  Import {validCount} Products
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Add Category Modal Component
const AddCategoryModal = ({ visible, onClose, onSave, isDarkMode }) => {
  const [categoryName, setCategoryName] = useState('');
  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  const handleSave = () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter category name');
      return;
    }
    onSave(categoryName.trim());
    setCategoryName('');
    onClose();
  };

  const handleClose = () => {
    setCategoryName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
            width: '80%',
            backgroundColor: isDarkMode ? '#374151' : 'white'
          }
        ]}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={[currentStyles.sectionTitleText, { fontSize: 18 }]}>
              Add New Category
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
          </View>

          <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
            Category Name
          </Text>
          <TextInput
            style={currentStyles.input}
            placeholder="Enter category name"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            value={categoryName}
            onChangeText={setCategoryName}
            autoFocus
          />

          <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
            <TouchableOpacity
              style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#6b7280' }]}
              onPress={handleClose}
            >
              <Text style={currentStyles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#059669' }]}
              onPress={handleSave}
            >
              <Text style={currentStyles.actionButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Add/Edit Product Modal Component
const AddEditProductModal = ({ visible, onClose, onSave, product, isDarkMode, categories, onAddCategory }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'General',
    stock: '0',
    sku: ''
  });
  const [showAddCategory, setShowAddCategory] = useState(false);

  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || 'General',
        stock: product.stock || '0',
        sku: product.sku || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'General',
        stock: '0',
        sku: ''
      });
    }
  }, [product, visible]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }

    if (!formData.price.trim() || isNaN(parseFloat(formData.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const productData = {
      id: product?.id || Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: formData.price.trim(),
      category: formData.category,
      stock: formData.stock.trim(),
      sku: formData.sku.trim(),
      createdAt: product?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(productData);
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'General',
      stock: '0',
      sku: ''
    });
    onClose();
  };

  const handleAddCategory = (categoryName) => {
    onAddCategory(categoryName);
    setFormData({ ...formData, category: categoryName });
  };

  return (
    <>
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
              <Text style={[currentStyles.sectionTitleText, { fontSize: 20 }]}>
                {product ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                Product Name *
              </Text>
              <TextInput
                style={currentStyles.input}
                placeholder="Enter product name"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                Description
              </Text>
              <TextInput
                style={[currentStyles.input, { minHeight: 60 }]}
                placeholder="Enter product description"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                    Price *
                  </Text>
                  <TextInput
                    style={currentStyles.input}
                    placeholder="0.00"
                    placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                    Stock Quantity
                  </Text>
                  <TextInput
                    style={currentStyles.input}
                    placeholder="0"
                    placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                    value={formData.stock}
                    onChangeText={(text) => setFormData({ ...formData, stock: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                SKU / Product Code
              </Text>
              <TextInput
                style={currentStyles.input}
                placeholder="Enter SKU or product code"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                value={formData.sku}
                onChangeText={(text) => setFormData({ ...formData, sku: text })}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
                <Text style={{ fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}>
                  Category
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#059669',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16
                  }}
                  onPress={() => setShowAddCategory(true)}
                >
                  <Feather name="plus" size={14} color="white" />
                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 4 }}>Add New</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: formData.category === category 
                          ? '#2563eb' 
                          : (isDarkMode ? '#4b5563' : '#e5e7eb'),
                        borderWidth: 1,
                        borderColor: formData.category === category 
                          ? '#2563eb' 
                          : (isDarkMode ? '#6b7280' : '#d1d5db')
                      }}
                      onPress={() => setFormData({ ...formData, category })}
                    >
                      <Text style={{
                        color: formData.category === category 
                          ? 'white' 
                          : (isDarkMode ? '#f3f4f6' : '#1f2937'),
                        fontSize: 12,
                        fontWeight: '500'
                      }}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
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
                onPress={handleSave}
              >
                <Text style={currentStyles.actionButtonText}>
                  {product ? 'Update' : 'Add'} Product
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AddCategoryModal
        visible={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSave={handleAddCategory}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

// Product Item Component
const ProductItem = ({ product, onEdit, onDelete, onUse, isDarkMode, formatCurrency }) => {
  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(product.id) }
      ]
    );
  };

  const stockColor = parseInt(product.stock || 0) <= 5 ? '#ef4444' : '#059669';

  return (
    <View style={[
      currentStyles.section,
      { 
        marginBottom: 12,
        backgroundColor: isDarkMode ? '#374151' : 'white'
      }
    ]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
            marginBottom: 4
          }}>
            {product.name}
          </Text>
          
          {product.description ? (
            <Text style={{
              fontSize: 14,
              color: isDarkMode ? '#d1d5db' : '#6b7280',
              marginBottom: 8
            }}>
              {product.description}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
              <Text style={{ fontWeight: '500' }}>Price:</Text> {formatCurrency(parseFloat(product.price || 0))}
            </Text>
            <Text style={{ fontSize: 14, color: stockColor, fontWeight: '500' }}>
              Stock: {product.stock || 0}
            </Text>
            <Text style={{
              fontSize: 12,
              backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
              color: isDarkMode ? '#d1d5db' : '#6b7280',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12
            }}>
              {product.category || 'General'}
            </Text>
          </View>

          {product.sku ? (
            <Text style={{
              fontSize: 12,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              marginBottom: 8
            }}>
              SKU: {product.sku}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginLeft: 12 }}>
          <TouchableOpacity
            style={{
              padding: 8,
              backgroundColor: '#059669',
              borderRadius: 6,
              minWidth: 60,
              alignItems: 'center'
            }}
            onPress={() => onUse(product)}
          >
            <Feather name="plus" size={16} color="white" />
            <Text style={{ color: 'white', fontSize: 10, marginTop: 2 }}>Use</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              padding: 8,
              backgroundColor: '#2563eb',
              borderRadius: 6,
              minWidth: 40,
              alignItems: 'center'
            }}
            onPress={() => onEdit(product)}
          >
            <Feather name="edit-2" size={16} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              padding: 8,
              backgroundColor: '#ef4444',
              borderRadius: 6,
              minWidth: 40,
              alignItems: 'center'
            }}
            onPress={handleDelete}
          >
            <Feather name="trash-2" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Info Modal Component to explain the Use button
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
        <View style={[
          currentStyles.section,
          {
            margin: 20,
            width: '85%',
            backgroundColor: isDarkMode ? '#374151' : 'white'
          }
        ]}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={[currentStyles.sectionTitleText, { fontSize: 18 }]}>
              How to Use Inventory
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#f3f4f6' : '#1f2937', marginBottom: 8 }}>
                📦 Inventory Management
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Store and organize your products with details like price, stock quantity, description, and categories.
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: 'bold', color: '#059669', marginBottom: 8 }}>
                ✅ The "Use" Button
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                When you click "Use" on a product, it automatically adds that item to your current invoice or order. This saves time by avoiding manual entry of product details and prices.
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: 'bold', color: '#7c3aed', marginBottom: 8 }}>
                📂 CSV Import
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Import multiple products at once from CSV files. The system automatically maps common column names like "name", "price", "stock", "category", etc.
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#f3f4f6' : '#1f2937', marginBottom: 8 }}>
                🏷️ Custom Categories
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Create your own product categories to better organize your inventory. Click the "Add New" button when selecting categories.
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: 8 }}>
                ⚠️ Low Stock Alert
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Products with 5 or fewer items in stock are highlighted in red to help you track inventory levels.
              </Text>
            </View>

            <View>
              <Text style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: 8 }}>
                🔍 Search & Filter
              </Text>
              <Text style={{ color: isDarkMode ? '#d1d5db' : '#6b7280', lineHeight: 20 }}>
                Use the search bar to find products by name, description, SKU, or category. Filter by categories for better organization.
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

// Main Inventory Management Component
const InventoryManagement = ({ showToast, isDarkMode, onUseProduct, formatCurrency }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [storageMode, setStorageMode] = useState('hybrid'); // 'sqlite', 'storage', 'hybrid'

  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  // Combine default and custom categories
  const allCategories = [...DEFAULT_PRODUCT_CATEGORIES, ...customCategories];

  // Load products and categories on component mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Filter products based on search and category
  useEffect(() => {
    filterProducts();
  }, [products, searchText, selectedCategory]);

  const initializeApp = async () => {
    setIsLoading(true);
    setDbError(null);
    
    try {
      await Promise.all([loadProducts(), loadCustomCategories()]);
    } catch (error) {
      console.error('App initialization error:', error);
      setDbError(error.message);
      showToast && showToast('Using offline mode - data saved locally', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    await withDatabaseFallback(
      async (db) => {
        const result = await db.getAllAsync('SELECT * FROM products ORDER BY updatedAt DESC');
        setProducts(result || []);
        setStorageMode('sqlite');
      },
      async () => {
        const storedProducts = await AsyncStorage.getItem('inventory_products');
        const products = storedProducts ? JSON.parse(storedProducts) : [];
        setProducts(products);
        setStorageMode('storage');
      }
    );
  };

  const loadCustomCategories = async () => {
    await withDatabaseFallback(
      async (db) => {
        const result = await db.getAllAsync('SELECT name FROM custom_categories ORDER BY name');
        const categories = result ? result.map(row => row.name) : [];
        setCustomCategories(categories);
      },
      async () => {
        const storedCategories = await AsyncStorage.getItem('inventory_categories');
        const categories = storedCategories ? JSON.parse(storedCategories) : [];
        setCustomCategories(categories);
      }
    );
  };

  const saveProductsToStorage = async (productsToSave) => {
    try {
      await AsyncStorage.setItem('inventory_products', JSON.stringify(productsToSave));
    } catch (error) {
      console.error('Error saving to AsyncStorage:', error);
    }
  };

  const saveCategoriesToStorage = async (categoriesToSave) => {
    try {
      await AsyncStorage.setItem('inventory_categories', JSON.stringify(categoriesToSave));
    } catch (error) {
      console.error('Error saving categories to AsyncStorage:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category first
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => 
        product.category && product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Then filter by search text
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

  const handleSaveProduct = async (productData) => {
    try {
      await withDatabaseFallback(
        async (db) => {
          if (editingProduct) {
            // Update existing product
            await db.runAsync(
              'UPDATE products SET name = ?, description = ?, price = ?, category = ?, stock = ?, sku = ?, updatedAt = ? WHERE id = ?',
              [productData.name, productData.description, productData.price, productData.category, productData.stock, productData.sku, productData.updatedAt, productData.id]
            );
          } else {
            // Add new product
            await db.runAsync(
              'INSERT INTO products (id, name, description, price, category, stock, sku, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [productData.id, productData.name, productData.description, productData.price, productData.category, productData.stock, productData.sku, productData.createdAt, productData.updatedAt]
            );
          }
          
          // Reload from database
          await loadProducts();
        },
        async () => {
          // Fallback to in-memory update
          let updatedProducts;
          if (editingProduct) {
            updatedProducts = products.map(p => p.id === productData.id ? productData : p);
          } else {
            updatedProducts = [productData, ...products];
          }
          
          setProducts(updatedProducts);
          await saveProductsToStorage(updatedProducts);
        }
      );
      
      setEditingProduct(null);
      showToast && showToast('Product saved successfully', 'success');
    } catch (error) {
      console.error('Error saving product:', error);
      showToast && showToast('Error saving product', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await withDatabaseFallback(
        async (db) => {
          await db.runAsync('DELETE FROM products WHERE id = ?', [productId]);
          await loadProducts();
        },
        async () => {
          const updatedProducts = products.filter(p => p.id !== productId);
          setProducts(updatedProducts);
          await saveProductsToStorage(updatedProducts);
        }
      );
      
      showToast && showToast('Product deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast && showToast('Error deleting product', 'error');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleUseProduct = (product) => {
    if (onUseProduct) {
      onUseProduct(product);
      showToast && showToast(`${product.name} added to invoice`, 'success');
    } else {
      Alert.alert(
        'Product Selected',
        `"${product.name}" would be added to your invoice/order when integrated with your sales system.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddCategory = async (categoryName) => {
    try {
      await withDatabaseFallback(
        async (db) => {
          // Check if category already exists
          const existing = await db.getFirstAsync('SELECT name FROM custom_categories WHERE name = ?', [categoryName]);
          
          if (existing || DEFAULT_PRODUCT_CATEGORIES.includes(categoryName)) {
            showToast && showToast('Category already exists', 'error');
            return;
          }
          
          await db.runAsync('INSERT INTO custom_categories (name) VALUES (?)', [categoryName]);
          await loadCustomCategories();
        },
        async () => {
          if (customCategories.includes(categoryName) || DEFAULT_PRODUCT_CATEGORIES.includes(categoryName)) {
            showToast && showToast('Category already exists', 'error');
            return;
          }
          
          const updatedCategories = [...customCategories, categoryName];
          setCustomCategories(updatedCategories);
          await saveCategoriesToStorage(updatedCategories);
        }
      );
      
      showToast && showToast(`Category "${categoryName}" added successfully`, 'success');
    } catch (error) {
      console.error('Error adding category:', error);
      showToast && showToast('Error adding category', 'error');
    }
  };

  const handleImportProducts = async (importedProducts) => {
    try {
      await withDatabaseFallback(
        async (db) => {
          // Insert all imported products
          for (const product of importedProducts) {
            await db.runAsync(
              'INSERT INTO products (id, name, description, price, category, stock, sku, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [product.id, product.name, product.description, product.price, product.category, product.stock, product.sku, product.createdAt, product.updatedAt]
            );
          }
          
          await loadProducts();
        },
        async () => {
          const updatedProducts = [...importedProducts, ...products];
          setProducts(updatedProducts);
          await saveProductsToStorage(updatedProducts);
        }
      );
      
      showToast && showToast(`${importedProducts.length} products imported successfully!`, 'success');
    } catch (error) {
      console.error('Error importing products:', error);
      showToast && showToast('Error importing products', 'error');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
        <Feather name="loader" size={32} color={isDarkMode ? '#f3f4f6' : '#1f2937'} />
        <Text style={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontSize: 16, marginTop: 12 }}>
          Loading inventory...
        </Text>
      </View>
    );
  }

  const categories = ['All', ...allCategories];
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => parseInt(p.stock || 0) <= 5).length;

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>
      {/* Header */}
      <View style={currentStyles.header}>
        <View style={currentStyles.headerTitle}>
          <Feather name="package" size={28} color="white"
           style={{
         marginLeft: 2,
         alignSelf: 'center',
         opacity: 0.9, 
         paddingTop: 22,
          }}
          />
          <Text style={currentStyles.headerText}>Inventory Management</Text>
          <TouchableOpacity
            onPress={() => setShowInfoModal(true)}
            style={{ marginLeft: 8 }}
          >
            <Feather name="info" size={20} color="white" 
             style={{
          marginRight: 6, 
         marginLeft: 10,
         alignSelf: 'center',
         opacity: 0.9, 
         paddingTop: 22,
          }}
            />
          </TouchableOpacity>
        </View>
        <Text style={currentStyles.headerSubtext}>
          Manage your products and inventory
        </Text>
        
        {storageMode === 'storage' && (
          <Text style={{
            color: '#fbbf24',
            fontSize: 12,
            marginTop: 4,
            textAlign: 'center'
          }}>
            📱 Offline mode - data saved locally
          </Text>
        )}
      </View>

      {/* Stats */}
      <View style={[currentStyles.section, { marginTop: 16, marginBottom: 8 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: '#2563eb' 
            }}>
              {totalProducts}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: isDarkMode ? '#9ca3af' : '#6b7280' 
            }}>
              Total Products
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: lowStockCount > 0 ? '#ef4444' : '#059669' 
            }}>
              {lowStockCount}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: isDarkMode ? '#9ca3af' : '#6b7280' 
            }}>
              Low Stock
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: '#7c3aed' 
            }}>
              {allCategories.length}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: isDarkMode ? '#9ca3af' : '#6b7280' 
            }}>
              Categories
            </Text>
          </View>
        </View>
      </View>

      {/* Search and Add Button */}
      <View style={[currentStyles.section, { marginBottom: 8 }]}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ flex: 1, position: 'relative' }}>
            <TextInput
              style={[currentStyles.input, { paddingLeft: 40 }]}
              placeholder="Search products, descriptions, SKU..."
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={searchText}
              onChangeText={(text) => setSearchText(text)}
            />
            <Feather 
              name="search" 
              size={20} 
              color={isDarkMode ? '#9ca3af' : '#6b7280'}
              style={{ position: 'absolute', left: 12, top: 12 }}
            />
            {searchText ? (
              <TouchableOpacity
                style={{ position: 'absolute', right: 12, top: 12 }}
                onPress={() => setSearchText('')}
              >
                <Feather name="x" size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[currentStyles.actionButton, {
               backgroundColor: '#059669',
               paddingVertical: 20,
               paddingHorizontal: 6,
               minHeight: 0,
               flex: 0,
             }]}
            onPress={handleAddProduct}
          >
            <Feather name="plus" size={16} color="white" />
            <Text style={currentStyles.actionButtonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[currentStyles.actionButton, {
               backgroundColor: '#7c3aed',
               paddingVertical: 20,
               paddingHorizontal: 6,
               minHeight: 0,
               flex: 0,
             }]}
            onPress={() => setShowImportModal(true)}
          >
            <Feather name="upload" size={16} color="white" />
            <Text style={currentStyles.actionButtonText}>Import</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <View style={{ marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 20,
                  backgroundColor: selectedCategory === category 
                    ? '#2563eb' 
                    : (isDarkMode ? '#374151' : 'white'),
                  borderWidth: 1,
                  borderColor: selectedCategory === category 
                    ? '#2563eb' 
                    : (isDarkMode ? '#4b5563' : '#d1d5db')
                }}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={{
                  color: selectedCategory === category 
                    ? 'white' 
                    : (isDarkMode ? '#f3f4f6' : '#1f2937'),
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Search Results Info */}
      {(searchText || selectedCategory !== 'All') && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{
            fontSize: 14,
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            fontStyle: 'italic'
          }}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            {searchText && ` for "${searchText}"`}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </Text>
        </View>
      )}

   {/* Products List */}
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductItem
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onUse={handleUseProduct}
              isDarkMode={isDarkMode}
              formatCurrency={formatCurrency}
            />
          ))
        ) : (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 64
          }}>
            <Feather 
              name={searchText || selectedCategory !== 'All' ? 'search' : 'package'} 
              size={64} 
              color={isDarkMode ? '#4b5563' : '#d1d5db'} 
            />
            <Text style={{
              fontSize: 18,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              marginTop: 16,
              textAlign: 'center'
            }}>
              {searchText || selectedCategory !== 'All' 
                ? 'No products found\nTry adjusting your search or filters' 
                : 'No products yet\nAdd your first product to get started'
              }
            </Text>
            {!searchText && selectedCategory === 'All' && (
              <TouchableOpacity
                style={[
                  currentStyles.actionButton,
                  { backgroundColor: '#2563eb', marginTop: 16 }
                ]}
                onPress={handleAddProduct}
              >
                <Feather name="plus" size={16} color="white" />
                <Text style={currentStyles.actionButtonText}>Add Product</Text>
              </TouchableOpacity>
            )}
            {(searchText || selectedCategory !== 'All') && (
              <TouchableOpacity
                style={[
                  currentStyles.actionButton,
                  { backgroundColor: '#6b7280', marginTop: 16 }
                ]}
                onPress={() => {
                  setSearchText('');
                  setSelectedCategory('All');
                }}
              >
                <Text style={currentStyles.actionButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* CSV Import Modal */}
      <CSVImportModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportProducts}
        isDarkMode={isDarkMode}
      />

      {/* Add/Edit Product Modal */}
      <AddEditProductModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        isDarkMode={isDarkMode}
        categories={allCategories}
        onAddCategory={handleAddCategory}
      />

      {/* Info Modal */}
      <InfoModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

export default InventoryManagement;