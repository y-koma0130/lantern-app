import { OnboardingPage } from "@/features/onboarding/components/onboarding-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Create Organization — Lantern",
};

export default function Page() {
	return <OnboardingPage />;
}
