import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
// Usaremos la ANON KEY o SERVICE ROLE KEY para registrar usuarios desde el backend
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Advertencia: Faltan las variables de entorno de Supabase (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
