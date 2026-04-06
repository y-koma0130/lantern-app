import { CreateOrgForm } from "@/features/onboarding/components/create-org-form";

export function OnboardingPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#FAFBFC] px-4">
			<div className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<h1 className="text-2xl font-bold text-[#172B4D]">Create your organization</h1>
					<p className="mt-2 text-sm text-[#505F79]">
						Set up your organization to start tracking competitive intelligence.
					</p>
				</div>
				<CreateOrgForm />
			</div>
		</div>
	);
}
