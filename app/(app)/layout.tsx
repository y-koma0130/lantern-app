import { AppShell } from "@/features/layout/components/app-shell";
import type { ReactNode } from "react";

interface LayoutProps {
	children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	return <AppShell>{children}</AppShell>;
}
