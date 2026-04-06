interface PlanCardProps {
	planId: string;
	name: string;
	price: number;
	competitors: string;
	members: string;
	frequency: string;
	isCurrentPlan: boolean;
}

export function PlanCard({
	name,
	price,
	competitors,
	members,
	frequency,
	isCurrentPlan,
}: PlanCardProps) {
	return (
		<div
			className="rounded-[3px] bg-white p-6"
			style={{
				border: isCurrentPlan ? "2px solid #0052CC" : "1px solid #DFE1E6",
			}}
		>
			<div className="mb-4 flex items-center gap-2">
				<h3 className="text-base font-semibold text-[#172B4D]">{name}</h3>
				{isCurrentPlan && (
					<span className="rounded-[3px] bg-[#DEEBFF] px-2 py-0.5 text-xs font-medium text-[#0052CC]">
						Current Plan
					</span>
				)}
			</div>

			<p className="mb-4">
				<span className="text-2xl font-bold text-[#172B4D]">${price}</span>
				<span className="text-sm text-[#505F79]">/month</span>
			</p>

			<ul className="space-y-2">
				<li className="flex items-center gap-2 text-sm text-[#172B4D]">
					<svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path
							d="M13.5 4.5L6 12L2.5 8.5"
							stroke="#36B37E"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					{competitors} competitors
				</li>
				<li className="flex items-center gap-2 text-sm text-[#172B4D]">
					<svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path
							d="M13.5 4.5L6 12L2.5 8.5"
							stroke="#36B37E"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					{members} members
				</li>
				<li className="flex items-center gap-2 text-sm text-[#172B4D]">
					<svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path
							d="M13.5 4.5L6 12L2.5 8.5"
							stroke="#36B37E"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					{frequency}
				</li>
			</ul>
		</div>
	);
}
