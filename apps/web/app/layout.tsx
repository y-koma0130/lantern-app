import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
	title: "Lantern — Competitive Intelligence for Cybersecurity",
	description:
		"Automated competitive intelligence SaaS for cybersecurity companies. Track competitors, analyze market trends, and gain strategic insights.",
};

interface RootLayoutProps {
	children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
