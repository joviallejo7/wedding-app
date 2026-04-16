import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wtjwhwbgldngrqqvinys.supabase.co";
const supabaseKey = "sb_publishable_itbJ8ubm7eIMefqCJs5U9g_ARi4nwYU";

export const supabase = createClient(supabaseUrl, supabaseKey);