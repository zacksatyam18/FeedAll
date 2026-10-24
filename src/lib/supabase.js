import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vxrtdkiakcsjhfenchim.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cnRka2lha2NzamhmZW5jaGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3OTk5MjIsImV4cCI6MjEwODM3NTkyMn0.DMraDeEdF1wgM0F0zARDml5S7XtZ3BPVwUng5j68yRc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
