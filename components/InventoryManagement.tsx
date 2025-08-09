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

// Local formatCurrency function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

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
              style={[currentStyles.actionButton, { flex: 1, backgroundColor: '#059669',
                
               }]}
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
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        sku: product.sku
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
const ProductItem = ({ product, onEdit, onDelete, onUse, isDarkMode }) => {
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

  const stockColor = parseInt(product.stock) <= 5 ? '#ef4444' : '#059669';

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
const InventoryManagement = ({ showToast, isDarkMode, onUseProduct }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);

  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  // Combine default and custom categories
  const allCategories = [...DEFAULT_PRODUCT_CATEGORIES, ...customCategories];

  // Load products and categories on component mount
  useEffect(() => {
    loadProducts();
    loadCustomCategories();
  }, []);

  // Filter products based on search and category
  useEffect(() => {
    filterProducts();
  }, [products, searchText, selectedCategory]);

  const loadProducts = async () => {
    try {
      const stored = await AsyncStorage.getItem('inventory_products');
      if (stored) {
        const loadedProducts = JSON.parse(stored);
        setProducts(loadedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showToast && showToast('Error loading products', 'error');
    }
  };

  const loadCustomCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem('custom_categories');
      if (stored) {
        const loadedCategories = JSON.parse(stored);
        setCustomCategories(loadedCategories);
      }
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  const saveProducts = async (updatedProducts) => {
    try {
      await AsyncStorage.setItem('inventory_products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
      showToast && showToast('Products updated successfully', 'success');
    } catch (error) {
      console.error('Error saving products:', error);
      showToast && showToast('Error saving products', 'error');
    }
  };

  const saveCustomCategories = async (categories) => {
    try {
      await AsyncStorage.setItem('custom_categories', JSON.stringify(categories));
      setCustomCategories(categories);
    } catch (error) {
      console.error('Error saving custom categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products]; // Create a copy to avoid mutation

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
      let updatedProducts;
      
      if (editingProduct) {
        // Update existing product
        updatedProducts = products.map(p => 
          p.id === editingProduct.id ? productData : p
        );
      } else {
        // Add new product
        updatedProducts = [...products, productData];
      }

      await saveProducts(updatedProducts);
      setEditingProduct(null);
    } catch (error) {
      showToast && showToast('Error saving product', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const updatedProducts = products.filter(p => p.id !== productId);
      await saveProducts(updatedProducts);
    } catch (error) {
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

  const handleAddCategory = (categoryName) => {
    if (!customCategories.includes(categoryName) && !DEFAULT_PRODUCT_CATEGORIES.includes(categoryName)) {
      const updatedCategories = [...customCategories, categoryName];
      saveCustomCategories(updatedCategories);
      showToast && showToast(`Category "${categoryName}" added successfully`, 'success');
    } else {
      showToast && showToast('Category already exists', 'error');
    }
  };

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
        
         marginLeft: 2,  // space between icon and text
         alignSelf: 'center', // vertical alignment
         opacity: 0.9, 
         paddingTop: 22,   // slightly faded look
    // slight rotation for style
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
         marginLeft: 10,  // space between icon and text
         alignSelf: 'center', // vertical alignment
         opacity: 0.9, 
         paddingTop: 22,

  }}
            />
          </TouchableOpacity>
        </View>
        <Text style={currentStyles.headerSubtext}>
          Manage your products and inventory
        </Text>
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
               paddingVertical: 20,   // smaller vertical padding
               paddingHorizontal: 6, // smaller horizontal padding
               minHeight: 0,
               flex: 0,
                         // prevent forced height
    
             }]}
            onPress={handleAddProduct}
          >
            <Feather name="plus" size={16} color="white" />
            <Text style={currentStyles.actionButtonText}>Add</Text>
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