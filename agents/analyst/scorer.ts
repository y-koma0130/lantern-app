import type { DetectedDiff } from "./differ.js";

const TYPE_WEIGHTS: Record<DetectedDiff["type"], number> = {
	pricing: 90,
	feature: 70,
	hiring: 50,
	funding: 85,
	sentiment: 40,
	messaging: 60,
};

export function scoreSignal(signal: DetectedDiff): number {
	return TYPE_WEIGHTS[signal.type] ?? 50;
}
