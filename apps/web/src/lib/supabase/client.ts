import { createBrowserClient } from "@supabase/ssr";
import { getEnvVar } from "./env";

const supabaseUrl = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");

export function createClient() {
	return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
