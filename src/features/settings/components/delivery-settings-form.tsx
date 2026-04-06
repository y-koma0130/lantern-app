"use client";

import { useState } from "react";

interface DeliverySettingsFormProps {
	orgId: string;
	initialChannelEmail: boolean;
	initialChannelSlack: string | null;
	initialChannelDiscord: string | null;
	initialDigestFrequency: "monthly" | "weekly";
	isOwner: boolean;
	canSlackDiscord: boolean;
	slackDiscordUpgradeMessage: string;
}

export function DeliverySettingsForm({
	orgId,
	initialChannelEmail,
	initialChannelSlack,
	initialChannelDiscord,
	initialDigestFrequency,
	isOwner,
	canSlackDiscord,
	slackDiscordUpgradeMessage,
}: DeliverySettingsFormProps) {
	const [channelEmail, setChannelEmail] = useState(initialChannelEmail);
	const [channelSlack, setChannelSlack] = useState(initialChannelSlack ?? "");
	const [channelDiscord, setChannelDiscord] = useState(initialChannelDiscord ?? "");
	const [digestFrequency, setDigestFrequency] = useState(initialDigestFrequency);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [testingSlack, setTestingSlack] = useState(false);
	const [testingDiscord, setTestingDiscord] = useState(false);
	const [testResult, setTestResult] = useState<{
		type: string;
		ok: boolean;
		message: string;
	} | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		setLoading(true);

		try {
			const res = await fetch(`/api/organizations/${orgId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					channelEmail,
					channelSlack: channelSlack || null,
					channelDiscord: channelDiscord || null,
					digestFrequency,
				}),
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setError(data.error ?? "Failed to save settings");
				setLoading(false);
				return;
			}

			setSuccess(true);
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	async function handleTestWebhook(type: "slack" | "discord") {
		const url = type === "slack" ? channelSlack : channelDiscord;
		if (!url) return;

		const setter = type === "slack" ? setTestingSlack : setTestingDiscord;
		setter(true);
		setTestResult(null);

		try {
			const res = await fetch("/api/webhooks/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type, url }),
			});

			if (res.ok) {
				setTestResult({
					type,
					ok: true,
					message: `${type === "slack" ? "Slack" : "Discord"} connected! Check your channel.`,
				});
			} else {
				const data = (await res.json()) as { error?: string };
				setTestResult({ type, ok: false, message: data.error ?? "Test failed" });
			}
		} catch {
			setTestResult({ type, ok: false, message: "Connection failed. Please check the URL." });
		} finally {
			setter(false);
		}
	}

	const inputClass =
		"w-full rounded-[3px] border border-[#DFE1E6] px-3 py-2 text-sm text-[#172B4D] shadow-sm focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] focus:outline-none h-9 disabled:bg-[#FAFBFC] disabled:text-[#A5ADBA] disabled:cursor-not-allowed";
	const canEditSlackDiscord = isOwner && canSlackDiscord;

	return (
		<div className="rounded-[3px] border border-[#DFE1E6] bg-white p-4">
			{error && (
				<div className="mb-4 rounded-[3px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			)}

			{success && (
				<div className="mb-4 rounded-[3px] border border-green-200 bg-green-50 p-3 text-sm text-green-700">
					Settings saved successfully.
				</div>
			)}

			{testResult && (
				<div
					className={`mb-4 rounded-[3px] border p-3 text-sm ${
						testResult.ok
							? "border-green-200 bg-green-50 text-green-700"
							: "border-red-200 bg-red-50 text-red-700"
					}`}
				>
					{testResult.message}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Email */}
				<div className="flex items-center justify-between">
					<div>
						<label htmlFor="channel-email" className="text-sm font-medium text-[#172B4D]">
							Email notifications
						</label>
						<p className="text-xs text-[#505F79]">Receive digest reports via email.</p>
					</div>
					<button
						id="channel-email"
						type="button"
						role="switch"
						aria-checked={channelEmail}
						disabled={!isOwner}
						onClick={() => setChannelEmail(!channelEmail)}
						className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:ring-2 focus:ring-[#0052CC] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
							channelEmail ? "bg-[#0052CC]" : "bg-[#DFE1E6]"
						}`}
					>
						<span
							className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
								channelEmail ? "translate-x-5" : "translate-x-0"
							}`}
						/>
					</button>
				</div>

				{/* Slack */}
				<div>
					<label htmlFor="channel-slack" className="mb-1 block text-sm font-medium text-[#172B4D]">
						Slack webhook URL
						<span className="ml-1 text-xs font-normal text-[#505F79]">(optional)</span>
					</label>
					<div className="flex gap-2">
						<input
							id="channel-slack"
							type="url"
							value={channelSlack}
							onChange={(e) => setChannelSlack(e.target.value)}
							disabled={!canEditSlackDiscord}
							className={inputClass}
							placeholder="https://hooks.slack.com/services/..."
						/>
						{canEditSlackDiscord && channelSlack && (
							<button
								type="button"
								onClick={() => handleTestWebhook("slack")}
								disabled={testingSlack}
								className="shrink-0 cursor-pointer rounded-[3px] border border-[#DFE1E6] bg-white px-3 py-1.5 text-xs font-medium text-[#505F79] hover:bg-[#F4F5F7] disabled:opacity-50"
							>
								{testingSlack ? "Testing..." : "Test"}
							</button>
						)}
					</div>
					<p className="mt-1 text-xs text-[#97A0AF]">
						Open Slack &rarr; Apps &rarr; Incoming Webhooks &rarr; Add to Slack &rarr; choose a
						channel &rarr; copy the Webhook URL.
					</p>
				</div>

				{/* Discord */}
				<div>
					<label
						htmlFor="channel-discord"
						className="mb-1 block text-sm font-medium text-[#172B4D]"
					>
						Discord webhook URL
						<span className="ml-1 text-xs font-normal text-[#505F79]">(optional)</span>
					</label>
					<div className="flex gap-2">
						<input
							id="channel-discord"
							type="url"
							value={channelDiscord}
							onChange={(e) => setChannelDiscord(e.target.value)}
							disabled={!canEditSlackDiscord}
							className={inputClass}
							placeholder="https://discord.com/api/webhooks/..."
						/>
						{canEditSlackDiscord && channelDiscord && (
							<button
								type="button"
								onClick={() => handleTestWebhook("discord")}
								disabled={testingDiscord}
								className="shrink-0 cursor-pointer rounded-[3px] border border-[#DFE1E6] bg-white px-3 py-1.5 text-xs font-medium text-[#505F79] hover:bg-[#F4F5F7] disabled:opacity-50"
							>
								{testingDiscord ? "Testing..." : "Test"}
							</button>
						)}
					</div>
					<p className="mt-1 text-xs text-[#97A0AF]">
						Open Discord &rarr; Server Settings &rarr; Integrations &rarr; Webhooks &rarr; New
						Webhook &rarr; choose a channel &rarr; copy the Webhook URL.
					</p>
				</div>

				{!canSlackDiscord && <p className="text-xs text-[#FF8B00]">{slackDiscordUpgradeMessage}</p>}

				{/* Frequency */}
				<div>
					<label
						htmlFor="digest-frequency"
						className="mb-1 block text-sm font-medium text-[#172B4D]"
					>
						Digest frequency
					</label>
					<select
						id="digest-frequency"
						value={digestFrequency}
						onChange={(e) => setDigestFrequency(e.target.value as "monthly" | "weekly")}
						disabled={!isOwner}
						className={inputClass}
					>
						<option value="weekly">Weekly</option>
						<option value="monthly">Monthly</option>
					</select>
				</div>

				{isOwner && (
					<div className="flex justify-end">
						<button
							type="submit"
							disabled={loading}
							className="cursor-pointer rounded-[3px] bg-[#0052CC] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0065FF] focus:ring-2 focus:ring-[#0052CC] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? "Saving..." : "Save Settings"}
						</button>
					</div>
				)}
			</form>
		</div>
	);
}
