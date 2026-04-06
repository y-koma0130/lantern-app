import { OrgGuard } from "@/features/layout/components/org-guard";
import type { ReactNode } from "react";

interface LayoutProps {
	children: ReactNode;
	params: Promise<{ orgSlug: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
	const { orgSlug } = await params;
	return <OrgGuard orgSlug={orgSlug}>{children}</OrgGuard>;
}
