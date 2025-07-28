// SavedInvoicesManager.js

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

export const saveInvoiceData = async (data, showToast) => {
  try {
    const existingData = await AsyncStorage.getItem('savedInvoices');
    const invoices = existingData ? JSON.parse(existingData) : [];
    const updated = [...invoices, data];
    await AsyncStorage.setItem('savedInvoices', JSON.stringify(updated));
    showToast('Invoice saved successfully', 'success');
  } catch (error) {
    showToast('Failed to save invoice', 'error');
  }
};

export const SavedInvoicesManager = ({ showToast }) => {
  const [savedInvoices, setSavedInvoices] = useState([]);

  useEffect(() => {
    loadSavedInvoices();
  }, []);
// Utility functions
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isNumeric = (value) => /^-?\d+(\.\d+)?$/.test(value);

  const loadSavedInvoices = async () => {
    try {
      const data = await AsyncStorage.getItem('savedInvoices');
      if (data) {
        setSavedInvoices(JSON.parse(data));
      }
    } catch (error) {
      showToast('Failed to load saved invoices', 'error');
    }
  };

  const clearSavedInvoices = () => {
    Alert.alert('Clear All', 'Are you sure you want to delete all saved invoices?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('savedInvoices');
            setSavedInvoices([]);
            showToast('All invoices deleted', 'success');
          } catch (error) {
            showToast('Failed to delete invoices', 'error');
          }
        },
      },
    ]);
  };
const validateForm = () => {
  // Business Info
  if (!businessInfo.name.trim()) {
    showToast('Business name is required', 'error');
    return false;
  }
  if (!isValidEmail(businessInfo.email)) {
    showToast('Enter a valid business email', 'error');
    return false;
  }
  if (!isNumeric(businessInfo.phone)) {
    showToast('Business phone must be numeric', 'error');
    return false;
  }

  // Customer Info
  if (!customerInfo.name.trim()) {
    showToast('Customer name is required', 'error');
    return false;
  }
  if (!isValidEmail(customerInfo.email)) {
    showToast('Enter a valid customer email', 'error');
    return false;
  }
  if (!isNumeric(customerInfo.phone)) {
    showToast('Customer phone must be numeric', 'error');
    return false;
  }

  // Tax Rate
  if (!isNumeric(taxRate)) {
    showToast('Tax rate must be a number', 'error');
    return false;
  }

  // Items
  if (items.length === 0 || !items.some(item => item.description.trim())) {
    showToast('Add at least one item with a description', 'error');
    return false;
  }

  for (let item of items) {
    if (!item.description.trim()) {
      showToast('Item description is required', 'error');
      return false;
    }
    if (!isNumeric(item.quantity)) {
      showToast(`Quantity for "${item.description}" must be numeric`, 'error');
      return false;
    }
    if (!isNumeric(item.price)) {
      showToast(`Price for "${item.description}" must be numeric`, 'error');
      return false;
    }
  }

  return true;
};

  const renderInvoice = (inv, index) => (
    <View
      key={index}
      style={{
        backgroundColor: 'white',
        marginBottom: 12,
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
        {inv.documentType.toUpperCase()} - {inv.invoiceNumber}
      </Text>
      <Text style={{ color: '#6b7280' }}>{inv.date}</Text>
      <Text style={{ marginTop: 8 }}>{inv.businessInfo.name} → {inv.customerInfo.name}</Text>
      <Text style={{ fontStyle: 'italic', color: '#4b5563' }}>
        Total Items: {inv.items.length}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>
          Saved Invoices
        </Text>
        <TouchableOpacity onPress={clearSavedInvoices}>
          <Feather name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {savedInvoices.length > 0 ? (
          savedInvoices.map(renderInvoice)
        ) : (
          <Text style={{ color: '#6b7280', textAlign: 'center' }}>No saved invoices found.</Text>
        )}
      </ScrollView>
    </View>
  );
};
