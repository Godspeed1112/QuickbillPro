import React, { useState, useEffect } from 'react';
import { SavedInvoicesTab } from 'components/savedInvoices';
import {View,Text,TextInput,TouchableOpacity,ScrollView,Alert,Share,Linking,SafeAreaView,StatusBar} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { generatePDF } from 'components/printPdf';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './context/ThemeContext';
import MainApp from 'components/MainApp';
import LoginScreen from 'components/Login';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return <MainApp />;
}

