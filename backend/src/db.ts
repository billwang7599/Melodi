import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabase: SupabaseClient | null = null;

export const initializeDatabase = async () => {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
        }
        
        supabase = createClient(supabaseUrl, supabaseKey);
        
        console.log('Supabase client initialized successfully');
    }
    return supabase;
};

export const getDatabase = async () => {
    if (!supabase) {
        await initializeDatabase();
    }
    return supabase!;
};
