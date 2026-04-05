import type { ReactNode } from "react";

interface AuthLayoutProps {
	children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
			<div className="w-full max-w-sm">{children}</div>
		</div>
	);
}
