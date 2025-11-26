import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined) => {
    try {
        if (!url) return false;
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl! : "https://placeholder.supabase.co";
const finalKey = supabaseAnonKey || "placeholder";

export const supabase = createClient(finalUrl, finalKey);
