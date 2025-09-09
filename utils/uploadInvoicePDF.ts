import { supabase } from './supabaseClient'
import * as FileSystem from 'expo-file-system'

// Upload PDF to Supabase Storage (optional)
const uploadInvoicePDF = async (fileUri: string, fileName: string) => {
  const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const { data, error } = await supabase.storage
    .from('invoices-pdfs') // create a bucket in Supabase storage
    .upload(fileName, Buffer.from(fileBase64, 'base64'), {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) throw error
  return data?.path
}

// Save generated invoice to Supabase
export const pushGeneratedInvoice = async (invoice: any, pdfUri: string) => {
  try {
    // upload PDF first
    const pdfPath = await uploadInvoicePDF(pdfUri, `${invoice.customer_name}_${Date.now()}.pdf`)

    // insert invoice record with PDF link
    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        ...invoice,
        pdf_url: pdfPath,
        status: 'generated',
      }])

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error pushing invoice:', err)
    return null
  }
}

export default uploadInvoicePDF;