import "@fontsource/figtree/700.css";

interface LogoProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeMap = {
	sm: "text-lg",
	md: "text-2xl",
	lg: "text-4xl",
} as const;

export function Logo({ size = "md", className = "" }: LogoProps) {
	return (
		<span
			className={`inline-flex font-bold lowercase tracking-tight ${sizeMap[size]} ${className}`}
			style={{ fontFamily: "'Figtree', sans-serif" }}
		>
			<span className="text-brand">l</span>
			<span className="text-text-primary">antern</span>
		</span>
	);
}
