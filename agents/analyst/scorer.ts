import type { DetectedDiff } from "./differ.js";

const TYPE_WEIGHTS: Record<DetectedDiff["type"], number> = {
	pricing: 90,
	funding: 85,
	sentiment: 75,
	feature: 70,
	hiring: 65,
	messaging: 60,
};

export function scoreSignal(signal: DetectedDiff): number {
	return TYPE_WEIGHTS[signal.type] ?? 50;
}
