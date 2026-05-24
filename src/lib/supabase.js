// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
// ATENÇÃO: substitua os dois valores abaixo pelos seus próprios
// Você vai encontrá-los no painel do Supabase em:
// Project Settings → API → Project URL e anon public key
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uvsemyrivjhoibajloyd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c2VteXJpdmpob2liYWpsb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzMwNDAsImV4cCI6MjA5NTIwOTA0MH0.c6Lh4uXmK75P-CT3z7kohbi74doX1R-_jHYAm59Fb1o'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
