import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cefghegygkasegzvccay.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZmdoZWd5Z2thc2VnenZjY2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDEyMTcsImV4cCI6MjA3OTk3NzIxN30.lPg8l2oBlLuTgmZkuWJNZxRKzmZBwX-GtTCd_q0TnW0'

export const supabase = createClient(supabaseUrl, supabaseKey)
