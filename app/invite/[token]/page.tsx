import { InvitePage } from "@/features/invite/components/invite-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Accept Invitation — Lantern",
};

interface PageProps {
	params: Promise<{ token: string }>;
}

export default async function Page({ params }: PageProps) {
	const { token } = await params;
	return <InvitePage token={token} />;
}
