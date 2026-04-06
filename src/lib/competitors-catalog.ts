export interface CatalogCompetitor {
	name: string;
	website: string;
	niche: string;
	g2Url?: string;
}

export const COMPETITORS_CATALOG: CatalogCompetitor[] = [
	// Cloud Security
	{ name: "Wiz", website: "https://www.wiz.io", niche: "Cloud Security" },
	{ name: "Orca Security", website: "https://orca.security", niche: "Cloud Security" },
	{ name: "Lacework", website: "https://www.lacework.com", niche: "Cloud Security" },
	{ name: "Aqua Security", website: "https://www.aquasec.com", niche: "Cloud Security" },
	{ name: "Sysdig", website: "https://sysdig.com", niche: "Cloud Security" },
	{
		name: "Prisma Cloud (Palo Alto)",
		website: "https://www.paloaltonetworks.com/prisma/cloud",
		niche: "Cloud Security",
	},

	// Endpoint / Threat Detection
	{
		name: "CrowdStrike Falcon",
		website: "https://www.crowdstrike.com",
		niche: "Endpoint Security",
	},
	{ name: "SentinelOne", website: "https://www.sentinelone.com", niche: "Endpoint Security" },
	{ name: "Darktrace", website: "https://www.darktrace.com", niche: "Threat Intelligence" },
	{ name: "Vectra AI", website: "https://www.vectra.ai", niche: "Threat Intelligence" },

	// Application Security
	{ name: "Snyk", website: "https://snyk.io", niche: "Application Security" },
	{ name: "Veracode", website: "https://www.veracode.com", niche: "Application Security" },
	{ name: "Checkmarx", website: "https://www.checkmarx.com", niche: "Application Security" },
	{ name: "Semgrep", website: "https://semgrep.dev", niche: "Application Security" },

	// GRC / Compliance
	{ name: "Drata", website: "https://drata.com", niche: "GRC" },
	{ name: "Vanta", website: "https://www.vanta.com", niche: "GRC" },
	{ name: "Tugboat Logic", website: "https://www.tugboatlogic.com", niche: "GRC" },
	{ name: "OneTrust", website: "https://www.onetrust.com", niche: "GRC" },
	{ name: "LogicGate", website: "https://www.logicgate.com", niche: "GRC" },

	// Identity & Access Management
	{ name: "Okta", website: "https://www.okta.com", niche: "Identity & Access Management" },
	{ name: "CyberArk", website: "https://www.cyberark.com", niche: "Identity & Access Management" },
	{
		name: "BeyondTrust",
		website: "https://www.beyondtrust.com",
		niche: "Identity & Access Management",
	},
];
