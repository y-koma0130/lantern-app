export interface Competitor {
	id: string;
	name: string;
	website: string;
	g2Url: string | null;
	githubOrg: string | null;
	linkedinSlug: string | null;
	crunchbaseSlug: string | null;
	niche: "cloud_security" | "grc" | "iam";
	createdAt: string;
}

export interface CompetitorSnapshot {
	id: string;
	competitorId: string;
	source: "website" | "g2" | "github" | "linkedin" | "hn" | "crunchbase";
	rawData: Record<string, unknown>;
	collectedAt: string;
}

export interface Insight {
	id: string;
	competitorId: string;
	snapshotId: string;
	type: "pricing" | "feature" | "hiring" | "funding" | "sentiment" | "messaging";
	importanceScore: number;
	summary: string;
	diffDetail: Record<string, unknown>;
	weekOf: string;
	createdAt: string;
}

export interface Digest {
	id: string;
	subscriberId: string;
	weekOf: string;
	contentMd: string;
	contentHtml: string;
	generatedAt: string;
}

export interface DeliveryLog {
	id: string;
	digestId: string;
	channel: "email" | "slack" | "discord";
	status: "sent" | "failed" | "retrying";
	attemptedAt: string;
}

export interface Subscriber {
	id: string;
	email: string;
	plan: "free" | "starter" | "pro" | "team";
	channelEmail: boolean;
	channelSlack: string | null;
	channelDiscord: string | null;
	competitorIds: string[];
	digestFrequency: string;
	createdAt: string;
}
