// Enhanced supabaseClient.ts with proper auth handling
import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';

const SUPABASE_URL = 'https://winnklludgrtqxhxzalr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpbm5rbGx1ZGdydHF4aHh6YWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTEzMTYsImV4cCI6MjA3MDE4NzMxNn0.-822eADpORYTkhMX3d8CYBaqBRJLZPxLNaPYgre1IAg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types remain the same...
export interface InvoiceData {
  invoice_number?: string;
  document_type?: string;
  customer_name?: string;
  customer_email?: string;
  customer_address?: string;
  total_amount?: number;
  currency?: string;
  status?: string;
  created_at?: string;
}

export interface SupabaseInvoice extends InvoiceData {
  id: string;
  pdf_url?: string;
  updated_at?: string;
}

// Check authentication before operations
const ensureAuthenticated = async (): Promise<boolean> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Auth session error:', error);
    return false;
  }
  
  if (!session?.user) {
    console.error('No authenticated user found');
    return false;
  }
  
  console.log('Authenticated user:', session.user.email);
  return true;
};

// Enhanced upload function with auth check
const uploadInvoicePDF = async (fileUri: string, fileName: string): Promise<string> => {
  try {
    // Check authentication first
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      throw new Error('User not authenticated');
    }

    // Read file as base64
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer
    const byteCharacters = atob(fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload to Supabase storage with explicit headers
    const { data, error } = await supabase.storage
      .from('invoices-pdfs')
      .upload(fileName, byteArray, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('Upload error details:', error);
      throw error;
    }

    return data?.path || '';
  } catch (err) {
    console.error('Error uploading PDF:', err);
    throw err;
  }
};

// Enhanced pushGeneratedInvoice with auth check
export const pushGeneratedInvoice = async (invoice: InvoiceData, pdfUri: string): Promise<SupabaseInvoice | null> => {
  try {
    // Check authentication first
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      throw new Error('User not authenticated');
    }

    // Generate unique filename
    const fileName = `${invoice.customer_name || 'invoice'}_${Date.now()}.pdf`;
    
    // Upload PDF first
    const pdfPath = await uploadInvoicePDF(pdfUri, fileName);

    // Insert invoice record with PDF link
    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        ...invoice,
        pdf_url: pdfPath,
        status: invoice.status || 'generated',
      }])
      .select()
      .single();

    if (error) {
      console.error('Database insert error details:', error);
      throw error;
    }

    return data as SupabaseInvoice;
  } catch (err) {
    console.error('Error pushing invoice:', err);
    return null;
  }
};

// Debug function to check auth status
export const debugAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Current user:', user);
  console.log('Auth error:', error);
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Current session:', session);
  console.log('Session error:', sessionError);
  
  return { user, session };
};

// Rest of your functions remain the same...
export const fetchInvoices = async (): Promise<SupabaseInvoice[]> => {
  try {
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      return [];
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch invoices error:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return [];
  }
};