import { createClient } from '@supabase/supabase-js';

const supabase = createClient(Bun.env.SUPABASE_URL!, Bun.env.SUPABASE_SERVICE_ROLE_KEY!);

export default supabase;
