import { CreateOrgForm } from "@/features/onboarding/components/create-org-form";

export function OnboardingPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
			<div className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<h1 className="text-2xl font-bold text-text-primary">Create your organization</h1>
					<p className="mt-2 text-sm text-text-secondary">
						Set up your organization to start tracking competitive intelligence.
					</p>
				</div>
				<CreateOrgForm />
			</div>
		</div>
	);
}
