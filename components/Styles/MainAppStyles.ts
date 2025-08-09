// components/styles/MainAppStyles.js - FIXED DARK MODE VERSION
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContainer: {
    padding: 16,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#1c5eaaff',
    padding: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
    paddingTop: 20,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  radioText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  itemDescription: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  itemQuantity: {
    width: 60,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  itemPrice: {
    width: 60,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  itemTotal: {
    width: 40,
    textAlign: 'right',
    fontWeight: '500',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  totalsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalText: {
    fontSize: 16,
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: '#bdbdbeff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 100,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  bottomTabBar: {
    position: 'relative',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 10,
    paddingTop: 5,
    borderRadius: 36,
    backgroundColor: 'white',
    borderTopColor: '#e5e7eb',
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bottomTabText: {
    fontSize: 12,
    marginTop: 4,
    color: '#6b7280',
  },
  activeBottomTabText: {
    color: '#2563eb',
    fontWeight: '500',
  },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  invoiceTitle: {
    fontSize: 18,
    paddingTop: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  invoiceDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});

// Enhanced Dark Mode Styles
export const darkStyless = {
  container: {
    backgroundColor: '#1f2937',
  },
  scrollContainer: {
    backgroundColor: '#1f2937',
  },
  section: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    borderWidth: 1,
  },
  header: {
    backgroundColor: '#111827',
  },
  headerText: {
    color: '#f3f4f6',
  },
  headerSubtext: {
    color: 'rgba(243, 244, 246, 0.8)',
  },
  sectionTitleText: {
    color: '#f3f4f6',
  },
  input: {
    backgroundColor: '#4b5563',
    borderColor: '#6b7280',
    color: '#f3f4f6',
  },
  bottomTabBar: {
    backgroundColor: '#374151',
    borderTopColor: '#4b5563',
  },
  bottomTabText: {
    color: '#9ca3af',
  },
  activeBottomTabText: {
    color: '#2563eb',
    fontWeight: '500',
  },
  actionButton: {
    shadowColor: '#000',
  },
  resetButton: {
    backgroundColor: '#dc2626',
  },
  resetButtonText: {
    color: '#ffffff',
  },
  itemRow: {
    backgroundColor: 'transparent',
  },
  itemDescription: {
    backgroundColor: '#4b5563',
    color: '#f3f4f6',
    borderColor: '#6b7280',
  },
  itemQuantity: {
    backgroundColor: '#4b5563',
    color: '#f3f4f6',
    borderColor: '#6b7280',
  },
  itemPrice: {
    backgroundColor: '#4b5563',
    color: '#f3f4f6',
    borderColor: '#6b7280',
  },
  itemTotal: {
    color: '#f3f4f6',
  },
  totalsContainer: {
    borderTopColor: '#6b7280',
  },
  totalText: {
    color: '#f3f4f6',
  },
  totalAmount: {
    color: '#f3f4f6',
  },
  grandTotal: {
    borderTopColor: '#6b7280',
  },
  textarea: {
    backgroundColor: '#4b5563',
    borderColor: '#6b7280',
    color: '#f3f4f6',
  },
  radioText: {
    color: '#f3f4f6',
  },
  addButtonText: {
    color: '#ffffff',
  },
  actionButtonText: {
    color: '#ffffff',
  },
  invoiceTitle: {
    color: '#f3f4f6',
  },
  invoiceDate: {
    color: '#9ca3af',
  },
  
};