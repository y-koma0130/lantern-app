import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnvVar } from "./env";

interface CookieToSet {
	name: string;
	value: string;
	options: CookieOptions;
}

export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient(
		getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
		getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet: CookieToSet[]) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options);
						}
					} catch {
						// Can be ignored when called from Server Components
						// Middleware handles session refresh
					}
				},
			},
		},
	);
}
