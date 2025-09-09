import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as MailComposer from "expo-mail-composer";

const handleSendInvoice = async (
  customerEmail: string | null,
  companyEmail: string,
  invoiceHtml: string
) => {
  try {
    // 1. Generate PDF
    const { base64 } = await Print.printToFileAsync({
      html: invoiceHtml,
      base64: true,
    });

    // 2. Save PDF locally
    const fileUri = FileSystem.documentDirectory + "invoice.pdf";
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Build recipients
    const recipients = customerEmail ? [customerEmail] : [companyEmail];
    const ccRecipients = customerEmail ? [companyEmail] : [];

    // 4. Open email client
    await MailComposer.composeAsync({
      recipients,
      ccRecipients, // company gets copy if customer exists
      subject: "Invoice from Digital Dive",
      body: "Thank you for your purchase! Please find your invoice attached.",
      attachments: [fileUri],
    });

  } catch (error) {
    console.error("Invoice email failed:", error);
  }
};

export default handleSendInvoice;