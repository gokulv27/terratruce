import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cefghegygkasegzvccay.supabase.co'
const supabaseKey = 'sb_publishable_UZDwqwIlJ2p0IQiIOTkrSA_muW7e3Km' // Using publishable key for client-side

export const supabase = createClient(supabaseUrl, supabaseKey)
