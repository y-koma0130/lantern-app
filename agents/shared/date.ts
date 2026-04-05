export function getCurrentWeek(): string {
	const now = new Date();
	const startOfWeek = new Date(now);
	startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday-based
	return startOfWeek.toISOString().split("T")[0] as string;
}
