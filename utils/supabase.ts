import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://winnklludgrtqxhxzalr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpbm5rbGx1ZGdydHF4aHh6YWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTEzMTYsImV4cCI6MjA3MDE4NzMxNn0.-822eADpORYTkhMX3d8CYBaqBRJLZPxLNaPYgre1IAg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
