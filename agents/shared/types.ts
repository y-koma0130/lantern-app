export interface Organization {
	id: string;
	name: string;
	slug: string;
	plan: "free" | "starter" | "pro" | "team";
	stripeCustomerId: string | null;
	stripeSubscriptionId: string | null;
	channelEmail: boolean;
	channelSlack: string | null;
	channelDiscord: string | null;
	digestFrequency: string;
	maxCompetitors: number;
	maxMembers: number;
	createdAt: string;
}

export interface OrganizationMember {
	id: string;
	orgId: string;
	userId: string;
	role: "owner" | "member";
	createdAt: string;
}

export interface Competitor {
	id: string;
	orgId: string;
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
	orgId: string;
	competitorId: string;
	source: "website" | "g2" | "github" | "linkedin" | "hn" | "crunchbase";
	rawData: Record<string, unknown>;
	collectedAt: string;
}

export interface Insight {
	id: string;
	orgId: string;
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
	orgId: string;
	weekOf: string;
	contentMd: string;
	contentHtml: string;
	generatedAt: string;
}

export interface DeliveryLog {
	id: string;
	orgId: string;
	digestId: string;
	channel: "email" | "slack" | "discord";
	status: "sent" | "failed" | "retrying";
	attemptedAt: string;
}
