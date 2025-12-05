import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yeabqgxdwdrsksnnxtvs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYWJxZ3hkd2Ryc2tzbm54dHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjA1MDksImV4cCI6MjA4MDUzNjUwOX0.gl3sJ3Co7PJfA_9z_X668P2Ql3CD6yiRAFm-gPtuc2o';

const isValidUrl = (url: string) => {
  try {
    return url.startsWith('http');
  } catch {
    return false;
  }
};

export const supabase = isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseKey)
  : null;