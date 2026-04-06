import type { BillingInterval, PlanFeatures } from "@/lib/stripe";

interface PlanCardProps {
	plan: PlanFeatures;
	interval: BillingInterval;
	isCurrentPlan: boolean;
	actionLabel: string;
	onSelect?: () => void;
	loading?: boolean;
	disabled?: boolean;
}

function CheckIcon() {
	return (
		<svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
			<path
				d="M13.5 4.5L6 12L2.5 8.5"
				stroke="#36B37E"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function CrossIcon() {
	return (
		<svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
			<path
				d="M4 4L12 12M12 4L4 12"
				stroke="#DFE1E6"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function FeatureRow({ enabled, label }: { enabled: boolean; label: string }) {
	return (
		<li
			className={`flex items-center gap-2 text-sm ${enabled ? "text-[#172B4D]" : "text-[#A5ADBA]"}`}
		>
			{enabled ? <CheckIcon /> : <CrossIcon />}
			{label}
		</li>
	);
}

function formatFrequency(frequency: string): string {
	switch (frequency) {
		case "monthly":
			return "Monthly digests";
		case "weekly":
			return "Weekly digests";
		default:
			return frequency;
	}
}

function formatArchive(days: number | null): string {
	if (days === null) return "Unlimited archive";
	if (days === 0) return "No archive";
	return `${days}-day archive`;
}

export function PlanCard({
	plan,
	interval,
	isCurrentPlan,
	actionLabel,
	onSelect,
	loading,
	disabled,
}: PlanCardProps) {
	const price = interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
	const hasAlerts = plan.frequency === "weekly" && (plan.battleCards || plan.csvExport);

	return (
		<div
			className="flex flex-col rounded-[3px] bg-white p-6"
			style={{
				border: isCurrentPlan ? "2px solid #0052CC" : "1px solid #DFE1E6",
			}}
		>
			<div className="mb-4 flex items-center gap-2">
				<h3 className="text-base font-semibold text-[#172B4D]">{plan.name}</h3>
				{isCurrentPlan && (
					<span className="rounded-[3px] bg-[#DEEBFF] px-2 py-0.5 text-xs font-medium text-[#0052CC]">
						Current
					</span>
				)}
			</div>

			<p className="mb-4">
				<span className="text-2xl font-bold text-[#172B4D]">${price}</span>
				<span className="text-sm text-[#505F79]">
					{price === 0 ? "" : `/${interval === "monthly" ? "mo" : "yr"}`}
				</span>
			</p>

			<ul className="mb-6 flex-1 space-y-2">
				<FeatureRow enabled label={`${plan.competitors} competitors`} />
				<FeatureRow enabled label={`${plan.members} user${plan.members > 1 ? "s" : ""}`} />
				<FeatureRow
					enabled
					label={hasAlerts ? "Weekly + daily alerts" : formatFrequency(plan.frequency)}
				/>
				<FeatureRow enabled={plan.emailDelivery} label="Email delivery" />
				<FeatureRow enabled={plan.slackDiscord} label="Slack / Discord" />
				<FeatureRow enabled={plan.battleCards} label="Battle cards" />
				<FeatureRow enabled={plan.csvExport} label="CSV export" />
				<FeatureRow enabled={plan.archiveDays !== 0} label={formatArchive(plan.archiveDays)} />
				<li className="pt-1 text-xs text-[#97A0AF]">{plan.support} support</li>
			</ul>

			{onSelect ? (
				<button
					type="button"
					onClick={onSelect}
					disabled={disabled || loading}
					className="w-full cursor-pointer rounded-[3px] bg-[#0052CC] px-4 py-2 text-sm font-medium text-white hover:bg-[#0065FF] disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? "Redirecting..." : actionLabel}
				</button>
			) : (
				<div className="w-full rounded-[3px] border border-[#DFE1E6] px-4 py-2 text-center text-sm font-medium text-[#505F79]">
					{actionLabel}
				</div>
			)}
		</div>
	);
}
