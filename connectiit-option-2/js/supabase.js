const SUPABASE_URL = 'https://gywholrlerycndwhsziq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9YjaGyLhfqzAn8yeTLVHog_qwDG4gJy';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.currentUser = null;