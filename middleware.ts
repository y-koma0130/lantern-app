import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
	"/",
	"/login",
	"/signup",
	"/invite",
	"/auth",
	"/api",
	"/onboarding",
	"/_next",
	"/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
	const response = NextResponse.next({
		request: { headers: request.headers },
	});

	const { supabase } = createMiddlewareClient(request, response);

	// Refresh the session — this keeps the auth cookie alive
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { pathname } = request.nextUrl;

	// Authenticated users hitting /login or /signup → redirect to home
	if (user && (pathname === "/login" || pathname === "/signup")) {
		const url = request.nextUrl.clone();
		url.pathname = "/";
		return NextResponse.redirect(url);
	}

	// Unauthenticated users hitting protected routes → redirect to login
	if (!user && !isPublicPath(pathname)) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization)
		 * - favicon.ico (favicon)
		 * - public folder assets
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
