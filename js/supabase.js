// =============================================================
// SUPABASE.JS — Arivukadal Sky Yoga
// Browser client initialization
// =============================================================

const SUPABASE_URL = "https://vwifxaufztllmwggbyil.supabase.co";
const SUPABASE_KEY = "sb_publishable_3hptE6qzba565zpEuZv29w_gnr25Vb7";

const supabaseClient = (typeof supabase !== 'undefined' && supabase.createClient)
    ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// Expose globally for application scripts
window.supabaseClient = supabaseClient;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;
