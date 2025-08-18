// HelpCard.tsx - React Native Version with TypeScript (FIXED)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface HelpCardProps {
  isDarkMode?: boolean;
}

interface HelpSection {
  title: string;
  icon: string;
  content: string[];
}

const HelpCard: React.FC<HelpCardProps> = ({ isDarkMode = false }) => {
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Toggle modal function
  const toggleModal = () => {
    console.log('Current modal state:', showHelpModal);
    setShowHelpModal(!showHelpModal);
    console.log('New modal state:', !showHelpModal);
  };

  const helpSections: HelpSection[] = [
    {
      title: "Getting Started",
      icon: "play-circle",
      content: [
        "• Set up your business information in the Settings tab",
        "• Add customers in the Customers tab for quick selection",
        "• Manage your products in the Inventory tab",
        "• Create professional invoices and receipts in the Create tab"
      ]
    },
    {
      title: "Creating Documents",
      icon: "file-text",
      content: [
        "• Choose between Invoice or Receipt document type",
        "• Select existing customers or enter details manually",
        "• Add items manually or pick from your inventory",
        "• Include business logo and signature for professional look",
        "• Preview, print, share, or save your documents"
      ]
    },
    {
      title: "Customer Management",
      icon: "users",
      content: [
        "• Add new customers with contact details",
        "• View customer purchase history",
        "• Edit or delete customer information",
        "• Search and filter customers easily"
      ]
    },
    {
      title: "Inventory Features",
      icon: "package",
      content: [
        "• Add products with name, price, and stock levels",
        "• Organize products by categories",
        "• Track SKU codes for better organization",
        "• Monitor low stock items with visual indicators",
        "• Use products directly in invoices"
      ]
    },
    {
      title: "Document Actions",
      icon: "share-2",
      content: [
        "• Share: Send document via messaging or social apps",
        "• Preview: View document before finalizing",
        "• Print: Generate PDF for printing",
        "• Save: Store document locally for future reference",
        "• Email: Send document directly to customer"
      ]
    },
    {
      title: "Settings & Customization",
      icon: "settings",
      content: [
        "• Choose your preferred currency",
        "• Set default tax rates",
        "• Configure company information",
        "• Enable dark mode for better visibility",
        "• Manage auto-save and backup preferences"
      ]
    }
  ];

  const styles = StyleSheet.create({
    helpIcon: {
      position: 'absolute',
      top: 60,
      right: 20,
      backgroundColor: '#2563eb',
      borderRadius: 25,
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 1000,
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#374151' : 'white',
      borderRadius: 12,
      maxHeight: '85%',
      width: '100%',
      maxWidth: 500,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#4b5563' : '#e5e7eb',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
    },
    sectionContainer: {
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionIconContainer: {
      backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
      marginLeft: 12,
    },
    contentText: {
      fontSize: 14,
      lineHeight: 22,
      color: isDarkMode ? '#d1d5db' : '#4b5563',
      marginLeft: 8,
      marginBottom: 4,
    },
    proTipsContainer: {
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? '#4b5563' : '#f8fafc',
      borderRadius: 8,
      marginHorizontal: 20,
    },
    proTipsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    proTipsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
      marginLeft: 8,
    },
    closeButton: {
      padding: 4,
    }
  });

  return (
    <>
      {/* Help Icon - Positioned absolutely */}
      <TouchableOpacity 
        style={styles.helpIcon}
        onPress={toggleModal}
        activeOpacity={0.7}
      >
        <Feather name="help-circle" size={24} color="white" />
      </TouchableOpacity>

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <Pressable 
          style={styles.modal}
          onPress={() => setShowHelpModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
              {/* Header */}
              <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather
                    name="book-open"
                    size={28}
                    color={isDarkMode ? '#60a5fa' : '#2563eb'}
                  />
                  <Text style={[styles.headerTitle, { marginLeft: 12 }]}>
                    How to Use QuickBill Pro
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowHelpModal(false)}
                  style={styles.closeButton}
                >
                  <Feather
                    name="x"
                    size={24}
                    color={isDarkMode ? '#f3f4f6' : '#1f2937'}
                  />
                </TouchableOpacity>
              </View>

              {/* Scroll Content */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingVertical: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {helpSections.map((section, index) => (
                  <View key={index} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionIconContainer}>
                        <Feather
                          name={section.icon}
                          size={20}
                          color={isDarkMode ? '#60a5fa' : '#2563eb'}
                        />
                      </View>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                    </View>
                    {section.content.map((item, itemIndex) => (
                      <Text key={itemIndex} style={styles.contentText}>
                        {item}
                      </Text>
                    ))}
                  </View>
                ))}

                {/* Pro Tips */}
                <View style={styles.proTipsContainer}>
                  <View style={styles.proTipsHeader}>
                    <Feather
                      name="plus"
                      size={18}
                      color={isDarkMode ? '#fbbf24' : '#f59e0b'}
                    />
                    <Text style={styles.proTipsTitle}>Pro Tips</Text>
                  </View>
                  <Text style={[styles.contentText, { marginLeft: 0 }]}>
                    • Use the inventory feature to speed up invoice creation{"\n"}
                    • Save customer information for faster future invoicing{"\n"}
                    • Enable auto-save in settings to prevent data loss{"\n"}
                    • Customize tax rates and currency in the Settings tab
                  </Text>
                </View>
              </ScrollView>
            </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default HelpCard;