import { createClient } from '@supabase/supabase-js'

// En entornos reales, guarda esto en un archivo .env de tu frontend
const SUPABASE_URL = "https://dlxfsdtdaywkskgmepap.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_MXs5zpuYd-m0nh8qHU87AQ_g1Wc9TfA"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)