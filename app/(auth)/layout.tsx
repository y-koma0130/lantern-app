import type { ReactNode } from "react";

interface AuthLayoutProps {
	children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
			<div className="w-full max-w-sm rounded-[3px] border border-border bg-white p-8 shadow-sm">
				{children}
			</div>
		</div>
	);
}
