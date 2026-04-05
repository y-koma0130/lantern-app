import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { getEnvVar } from "./env";

interface CookieToSet {
	name: string;
	value: string;
	options: CookieOptions;
}

export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
	const supabase = createServerClient(
		getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
		getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet: CookieToSet[]) {
					for (const { name, value, options } of cookiesToSet) {
						request.cookies.set(name, value);
						response.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	return { supabase, response };
}
