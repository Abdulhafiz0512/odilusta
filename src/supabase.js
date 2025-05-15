import { createClient } from '@supabase/supabase-js';


const supabaseUrl='https://uzmgrskphtsfqauzjxmd.supabase.co'
const supabaseKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bWdyc2twaHRzZnFhdXpqeG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjg2NjcsImV4cCI6MjA2MjkwNDY2N30.26z_gpBGA2gNBMuX1KImAjrIaFoy2tXFJGIcxDVMGLg'
        

export const supabase = createClient(supabaseUrl, supabaseKey);
