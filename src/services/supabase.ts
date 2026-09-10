/**
 * The Supabase client, and nothing else.
 *
 * Queries live with the feature that owns them (`src/features/<x>/api.ts`) so
 * this file stays a single obvious place to look for connection concerns.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
