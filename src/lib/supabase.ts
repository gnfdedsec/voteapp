import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug: Log environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment Variables Debug:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Not set')
}

// Check if environment variables are set
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please check your .env.local file.')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 