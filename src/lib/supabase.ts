import { createClient } from "@supabase/supabase-js";

// Ces variables doivent être définies dans votre fichier .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Attention : Les variables d'environnement Supabase sont manquantes.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
