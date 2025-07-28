// components/printPdf.js
// components/printPdf.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Linking,
  Image,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export const PrintPdf = ({ visible, onClose, invoiceData, showToast }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUri, setPdfUri] = useState(null);

  // Convert image URI to base64
  const convertImageToBase64 = async (imageUri) => {
    if (!imageUri) return null;
    
    try {
      // Check if it's already a base64 string
      if (imageUri.startsWith('data:image/')) {
        return imageUri;
      }
      
      // Convert file URI to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Determine the image type from the URI
      const imageType = imageUri.toLowerCase().includes('.png') ? 'png' : 'jpeg';
      
      return `data:image/${imageType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  // Generate HTML content for PDF - Optimized for A4
  const generateHtmlContent = async () => {
    const {
      documentType,
      invoiceNumber,
      date,
      businessInfo,
      customerInfo,
      items,
      taxRate,
      notes,
      businessLogo,
      customerSignature,
      subtotal,
      tax,
      total,
      formatCurrency
    } = invoiceData;

    // Convert images to base64
    const businessLogoBase64 = businessLogo ? await convertImageToBase64(businessLogo) : null;
    const customerSignatureBase64 = customerSignature ? await convertImageToBase64(customerSignature) : null;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${documentType.toUpperCase()} ${invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #2d3748;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 0;
          background: white;
        }
        
        .page-container {
          width: 100%;
          max-width: 180mm;
          margin: 0 auto;
        }
        
        /* Header Section */
        .header {
          display: table;
          width: 100%;
          margin-bottom: 20px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 15px;
          page-break-inside: avoid;
        }
        
        .header-left {
          display: table-cell;
          width: 50%;
          vertical-align: top;
        }
        
        .header-right {
          display: table-cell;
          width: 50%;
          vertical-align: top;
          text-align: right;
        }
        
        .business-logo {
          max-width: 120px;
          max-height: 60px;
          object-fit: contain;
          margin-bottom: 8px;
          display: block;
        }
        
        .business-name {
          font-size: 16px;
          font-weight: bold;
          color: #1a202c;
          margin-bottom: 4px;
        }
        
        .document-title {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 4px;
        }
        
        .document-number {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 2px;
        }
        
        .document-date {
          font-size: 11px;
          color: #718096;
        }
        
        /* Party Information */
        .party-info {
          display: table;
          width: 100%;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .party-from {
          display: table-cell;
          width: 48%;
          vertical-align: top;
          padding-right: 4%;
        }
        
        .party-to {
          display: table-cell;
          width: 48%;
          vertical-align: top;
        }
        
        .party-title {
          font-size: 12px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 6px;
          padding-bottom: 3px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .party-name {
          font-weight: bold;
          font-size: 12px;
          color: #1a202c;
          margin-bottom: 3px;
        }
        
        .party-detail {
          font-size: 10px;
          color: #4a5568;
          margin-bottom: 2px;
          line-height: 1.2;
        }
        
        /* Items Table */
        .items-section {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        .items-table th {
          background-color: #f7fafc;
          padding: 8px 6px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #cbd5e0;
          color: #2d3748;
          font-size: 10px;
        }
        
        .items-table td {
          padding: 6px;
          border: 1px solid #e2e8f0;
          vertical-align: top;
          font-size: 10px;
        }
        
        .items-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .col-description { width: 45%; }
        .col-quantity { width: 12%; text-align: center; }
        .col-price { width: 18%; text-align: right; }
        .col-total { width: 18%; text-align: right; }
        
        /* Totals Section */
        .totals-wrapper {
          display: table;
          width: 100%;
          margin-bottom: 15px;
        }
        
        .totals-spacer {
          display: table-cell;
          width: 60%;
        }
        
        .totals-section {
          display: table-cell;
          width: 40%;
          vertical-align: top;
        }
        
        .total-row {
          display: table;
          width: 100%;
          margin-bottom: 3px;
        }
        
        .total-label {
          display: table-cell;
          padding: 4px 8px 4px 0;
          font-size: 11px;
          color: #4a5568;
        }
        
        .total-value {
          display: table-cell;
          text-align: right;
          padding: 4px 0;
          font-size: 11px;
          color: #2d3748;
        }
        
        .grand-total {
          border-top: 2px solid #2563eb;
          border-bottom: 2px solid #2563eb;
          background-color: #f7fafc;
          margin-top: 6px;
        }
        
        .grand-total .total-label,
        .grand-total .total-value {
          font-weight: bold;
          font-size: 13px;
          padding: 8px 8px 8px 0;
          color: #1a202c;
        }
        
        .grand-total .total-value {
          padding-right: 0;
        }
        
        /* Notes Section */
        .notes-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .notes-title {
          font-size: 12px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 6px;
        }
        
        .notes-content {
          background-color: #f8f9fa;
          padding: 10px;
          border-left: 3px solid #2563eb;
          border-radius: 3px;
          font-size: 10px;
          line-height: 1.4;
          color: #4a5568;
        }
        
        /* Signature Section */
        .signature-section {
          display: table;
          width: 100%;
          margin-top: 30px;
          page-break-inside: avoid;
        }
        
        .signature-business {
          display: table-cell;
          width: 48%;
          vertical-align: bottom;
          text-align: center;
          padding-right: 4%;
        }
        
        .signature-customer {
          display: table-cell;
          width: 48%;
          vertical-align: bottom;
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 1px solid #4a5568;
          height: 40px;
          margin-bottom: 6px;
        }
        
        .signature-image {
          max-width: 140px;
          max-height: 40px;
          object-fit: contain;
          border: 1px solid #e2e8f0;
          margin-bottom: 6px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        
        .signature-label {
          font-size: 9px;
          color: #718096;
          font-weight: 500;
        }
        
        /* Footer */
        .footer {
          text-align: center;
          margin-top: 25px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          font-size: 9px;
          color: #718096;
          page-break-inside: avoid;
        }
        
        .footer-thank-you {
          font-weight: 500;
          margin-bottom: 3px;
        }
        
        /* Print Specific Styles */
        @media print {
          body {
            font-size: 10px;
            margin: 0;
            padding: 0;
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
        }
        
        /* Responsive adjustments for very long content */
        .items-table tbody tr {
          page-break-inside: avoid;
        }
        
        .items-table thead {
          display: table-header-group;
        }
        
        /* Ensure consistent spacing */
        .section-spacing {
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- Header Section -->
        <div class="header avoid-break">
          <div class="header-left">
            ${businessLogoBase64 ? `<img src="${businessLogoBase64}" alt="Business Logo" class="business-logo">` : ''}
            <div class="business-name">${businessInfo.name}</div>
          </div>
          <div class="header-right">
            <div class="document-title">${documentType.toUpperCase()}</div>
            <div class="document-number">${invoiceNumber}</div>
            <div class="document-date">Date: ${date}</div>
          </div>
        </div>
        
        <!-- Party Information -->
        <div class="party-info avoid-break section-spacing">
          <div class="party-from">
            <div class="party-title">From:</div>
            <div class="party-name">${businessInfo.name}</div>
            ${businessInfo.address ? `<div class="party-detail">${businessInfo.address}</div>` : ''}
            ${businessInfo.phone ? `<div class="party-detail">Phone: ${businessInfo.phone}</div>` : ''}
            ${businessInfo.email ? `<div class="party-detail">Email: ${businessInfo.email}</div>` : ''}
            ${businessInfo.taxId ? `<div class="party-detail">Tax ID: ${businessInfo.taxId}</div>` : ''}
          </div>
          
          <div class="party-to">
            <div class="party-title">To:</div>
            <div class="party-name">${customerInfo.name}</div>
            ${customerInfo.address ? `<div class="party-detail">${customerInfo.address}</div>` : ''}
            ${customerInfo.phone ? `<div class="party-detail">Phone: ${customerInfo.phone}</div>` : ''}
            ${customerInfo.email ? `<div class="party-detail">Email: ${customerInfo.email}</div>` : ''}
          </div>
        </div>
        
        <!-- Items Table -->
        <div class="items-section section-spacing">
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
              ${items.map(item => `
                <tr>
                  <td class="col-description">${item.description}</td>
                  <td class="col-quantity">${item.quantity}</td>
                  <td class="col-price">${formatCurrency(parseFloat(item.price || 0))}</td>
                  <td class="col-total">${formatCurrency(parseFloat(item.quantity || 0) * parseFloat(item.price || 0))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Totals Section -->
        <div class="totals-wrapper section-spacing">
          <div class="totals-spacer"></div>
          <div class="totals-section">
            <div class="total-row">
              <div class="total-label">Subtotal:</div>
              <div class="total-value">${formatCurrency(subtotal)}</div>
            </div>
            <div class="total-row">
              <div class="total-label">Tax (${taxRate}%):</div>
              <div class="total-value">${formatCurrency(tax)}</div>
            </div>
            <div class="total-row grand-total">
              <div class="total-label">TOTAL:</div>
              <div class="total-value">${formatCurrency(total)}</div>
            </div>
          </div>
        </div>
        
        <!-- Notes Section -->
        ${notes ? `
          <div class="notes-section section-spacing avoid-break">
            <div class="notes-title">Notes:</div>
            <div class="notes-content">${notes}</div>
          </div>
        ` : ''}
        
        <!-- Signature Section -->
        <div class="signature-section avoid-break">
          <div class="signature-business">
            <div class="signature-line"></div>
            <div class="signature-label">Business Signature</div>
          </div>
          
          <div class="signature-customer">
            ${customerSignatureBase64 ? 
              `<img src="${customerSignatureBase64}" alt="Customer Signature" class="signature-image">` : 
              `<div class="signature-line"></div>`
            }
            <div class="signature-label">Customer Signature</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer avoid-break">
          <div class="footer-thank-you">Thank you for your business!</div>
          <div>Generated on ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  // Generate PDF
  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      
      const htmlContent = await generateHtmlContent(); // Now it's async
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 595, // A4 width in points
        height: 842  // A4 height in points
      });
      
      setPdfUri(uri);
      showToast('PDF generated successfully!', 'success');
      return uri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Print PDF
  const handlePrint = async () => {
    try {
      const htmlContent = await generateHtmlContent(); // Now it's async
      
      await Print.printAsync({
        html: htmlContent,
        printerUrl: undefined // Let user select printer
      });
      
      showToast('Document sent to printer', 'success');
    } catch (error) {
      console.error('Print error:', error);
      showToast('Failed to print document', 'error');
    }
  };

  // Share PDF
  const handleShare = async () => {
    try {
      let uri = pdfUri;
      
      if (!uri) {
        uri = await generatePDF();
        if (!uri) return;
      }
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${invoiceData.documentType} ${invoiceData.invoiceNumber}`
        });
      } else {
        showToast('Sharing not available on this device', 'error');
      }
    } catch (error) {
      console.error('Share error:', error);
      showToast('Failed to share PDF', 'error');
    }
  };

  // Save PDF to device
  const handleSave = async () => {
    try {
      let uri = pdfUri;
      
      if (!uri) {
        uri = await generatePDF();
        if (!uri) return;
      }
      
      const filename = `${invoiceData.documentType}_${invoiceData.invoiceNumber}_${Date.now()}.pdf`;
      const documentDirectory = FileSystem.documentDirectory;
      const newUri = documentDirectory + filename;
      
      await FileSystem.copyAsync({
        from: uri,
        to: newUri
      });
      
      showToast('PDF saved to device storage', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showToast('Failed to save PDF', 'error');
    }
  };

  // Email PDF
  const handleEmail = async () => {
    try {
      let uri = pdfUri;
      
      if (!uri) {
        uri = await generatePDF();
        if (!uri) return;
      }
      
      const subject = `${invoiceData.documentType.toUpperCase()} ${invoiceData.invoiceNumber}`;
      const body = `Please find attached ${invoiceData.documentType} ${invoiceData.invoiceNumber}.`;
      
      const mailtoLink = `mailto:${invoiceData.customerInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      await Linking.openURL(mailtoLink);
    } catch (error) {
      console.error('Email error:', error);
      showToast('Failed to open email app', 'error');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {invoiceData.documentType.toUpperCase()} Preview
            </Text>
          </View>
        </View>

        {/* PDF Preview Content */}
        <ScrollView style={styles.previewContainer}>
          <View style={styles.previewContent}>
            {/* Document Header */}
            <View style={styles.documentHeader}>
              <View style={styles.logoSection}>
                {invoiceData.businessLogo && (
                  <Image 
                    source={{ uri: invoiceData.businessLogo }} 
                    style={styles.businessLogo}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.businessName}>{invoiceData.businessInfo.name}</Text>
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>
                  {invoiceData.documentType.toUpperCase()}
                </Text>
                <Text style={styles.documentNumber}>{invoiceData.invoiceNumber}</Text>
                <Text style={styles.documentDate}>Date: {invoiceData.date}</Text>
              </View>
            </View>

            {/* Party Information */}
            <View style={styles.partyInfo}>
              <View style={styles.partySection}>
                <Text style={styles.partyTitle}>From:</Text>
                <Text style={styles.partyName}>{invoiceData.businessInfo.name}</Text>
                {invoiceData.businessInfo.address && (
                  <Text style={styles.partyDetail}>{invoiceData.businessInfo.address}</Text>
                )}
                {invoiceData.businessInfo.phone && (
                  <Text style={styles.partyDetail}>Phone: {invoiceData.businessInfo.phone}</Text>
                )}
                {invoiceData.businessInfo.email && (
                  <Text style={styles.partyDetail}>Email: {invoiceData.businessInfo.email}</Text>
                )}
              </View>
              
              <View style={styles.partySection}>
                <Text style={styles.partyTitle}>To:</Text>
                <Text style={styles.partyName}>{invoiceData.customerInfo.name}</Text>
                {invoiceData.customerInfo.address && (
                  <Text style={styles.partyDetail}>{invoiceData.customerInfo.address}</Text>
                )}
                {invoiceData.customerInfo.phone && (
                  <Text style={styles.partyDetail}>Phone: {invoiceData.customerInfo.phone}</Text>
                )}
                {invoiceData.customerInfo.email && (
                  <Text style={styles.partyDetail}>Email: {invoiceData.customerInfo.email}</Text>
                )}
              </View>
            </View>

            {/* Items Table */}
            <View style={styles.itemsTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Total</Text>
              </View>
              
              {invoiceData.items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.description}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                    {invoiceData.formatCurrency(parseFloat(item.price || 0))}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                    {invoiceData.formatCurrency(parseFloat(item.quantity || 0) * parseFloat(item.price || 0))}
                  </Text>
                </View>
              ))}
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{invoiceData.formatCurrency(invoiceData.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({invoiceData.taxRate}%):</Text>
                <Text style={styles.totalValue}>{invoiceData.formatCurrency(invoiceData.tax)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={styles.grandTotalLabel}>TOTAL:</Text>
                <Text style={styles.grandTotalValue}>{invoiceData.formatCurrency(invoiceData.total)}</Text>
              </View>
            </View>

            {/* Notes */}
            {invoiceData.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Notes:</Text>
                <Text style={styles.notesContent}>{invoiceData.notes}</Text>
              </View>
            )}

            {/* Signature */}
            {invoiceData.customerSignature && (
              <View style={styles.signatureSection}>
                <Text style={styles.signatureTitle}>Customer Signature:</Text>
                <Image 
                  source={{ uri: invoiceData.customerSignature }} 
                  style={styles.signatureImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#059669' }]}
            onPress={handlePrint}
            disabled={isGenerating}
          >
            <Feather name="printer" size={16} color="white" />
            <Text style={styles.actionButtonText}>Print</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2563eb' }]}
            onPress={handleShare}
            disabled={isGenerating}
          >
            <Feather name="share" size={16} color="white" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ea580c' }]}
            onPress={handleSave}
            disabled={isGenerating}
          >
            <Feather name="download" size={16} color="white" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#7c3aed' }]}
            onPress={handleEmail}
            disabled={isGenerating}
          >
            <Feather name="mail" size={16} color="white" />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  closeButton: {
    padding: 8,
    marginRight: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151'
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 16
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
    fontWeight: 'bold',
    color: '#374151'
  },
  documentInfo: {
    alignItems: 'flex-end'
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4
  },
  documentNumber: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4
  },
  documentDate: {
    fontSize: 14,
    color: '#6b7280'
  },
  partyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  partySection: {
    flex: 1,
    marginRight: 16
  },
  partyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
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
  itemsTable: {
    marginBottom: 24
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff'
  },
  tableCell: {
    fontSize: 12,
    color: '#374151'
  },
  totalsSection: {
    alignSelf: 'flex-end',
    width: width * 0.6,
    marginBottom: 24
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  totalLabel: {
    fontSize: 14,
    color: '#374151'
  },
  totalValue: {
    fontSize: 14,
    color: '#374151'
  },
  grandTotal: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151'
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151'
  },
  notesSection: {
    marginBottom: 24
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8
  },
  notesContent: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb'
  },
  signatureSection: {
    marginTop: 32,
    alignItems: 'center'
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8
  },
  signatureImage: {
    width: 150,
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 6
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 12
  }
};