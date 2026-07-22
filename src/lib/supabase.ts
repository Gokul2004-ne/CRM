import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yxoiptizftrtrwauupfg.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_QCvGUkx-kTHl1hy3fSrexQ_zPXiJP7d";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
