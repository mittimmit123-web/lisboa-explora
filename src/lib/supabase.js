import { createClient } from '@supabase/supabase-js'

// The keys come from the .env file (see .env.example). Never commit .env.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// No keys -> null -> the app runs in DEMO MODE (data stays in this browser).
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const isDemoMode = supabase === null
