"use client";

import { Toast } from "@/components/toast";
import { useCallback, useState } from "react";

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
	const [savingSlack, setSavingSlack] = useState(false);
	const [savingDiscord, setSavingDiscord] = useState(false);
	const [savingFrequency, setSavingFrequency] = useState(false);
	const [testingSlack, setTestingSlack] = useState(false);
	const [testingDiscord, setTestingDiscord] = useState(false);
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

	const dismissToast = useCallback(() => setToast(null), []);
	const canEditSlackDiscord = isOwner && canSlackDiscord;

	async function patchOrg(data: Record<string, unknown>, successMsg: string): Promise<boolean> {
		try {
			const res = await fetch(`/api/organizations/${orgId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (res.ok) {
				setToast({ message: successMsg, type: "success" });
				return true;
			}
			const err = (await res.json()) as { error?: string };
			setToast({ message: err.error ?? "Failed to save.", type: "error" });
			return false;
		} catch {
			setToast({ message: "Something went wrong.", type: "error" });
			return false;
		}
	}

	async function handleEmailToggle() {
		const newValue = !channelEmail;
		setChannelEmail(newValue);
		const ok = await patchOrg(
			{ channelEmail: newValue },
			`Email notifications ${newValue ? "enabled" : "disabled"}.`,
		);
		if (!ok) setChannelEmail(!newValue);
	}

	async function handleSaveSlack() {
		setSavingSlack(true);
		await patchOrg({ channelSlack: channelSlack || null }, "Slack webhook saved.");
		setSavingSlack(false);
	}

	async function handleSaveDiscord() {
		setSavingDiscord(true);
		await patchOrg({ channelDiscord: channelDiscord || null }, "Discord webhook saved.");
		setSavingDiscord(false);
	}

	async function handleSaveFrequency() {
		setSavingFrequency(true);
		await patchOrg({ digestFrequency }, "Digest frequency updated.");
		setSavingFrequency(false);
	}

	async function handleTestWebhook(type: "slack" | "discord") {
		const url = type === "slack" ? channelSlack : channelDiscord;
		if (!url) return;

		const setter = type === "slack" ? setTestingSlack : setTestingDiscord;
		setter(true);

		try {
			const res = await fetch("/api/webhooks/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type, url }),
			});

			if (res.ok) {
				setToast({
					message: `${type === "slack" ? "Slack" : "Discord"} connected! Check your channel.`,
					type: "success",
				});
			} else {
				const data = (await res.json()) as { error?: string };
				setToast({ message: data.error ?? "Test failed.", type: "error" });
			}
		} catch {
			setToast({ message: "Connection failed. Please check the URL.", type: "error" });
		} finally {
			setter(false);
		}
	}

	const inputClass =
		"w-full rounded-[3px] border border-[#DFE1E6] px-3 py-2 text-sm text-[#172B4D] shadow-sm focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] focus:outline-none h-9 disabled:bg-[#FAFBFC] disabled:text-[#A5ADBA] disabled:cursor-not-allowed";
	const btnSecondary =
		"shrink-0 cursor-pointer rounded-[3px] border border-[#DFE1E6] bg-white px-3 py-1.5 text-xs font-medium text-[#505F79] hover:bg-[#F4F5F7] disabled:opacity-50";
	const btnPrimary =
		"shrink-0 cursor-pointer rounded-[3px] bg-[#0052CC] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0065FF] disabled:opacity-50";

	return (
		<div className="space-y-4">
			{/* Email */}
			<div className="rounded-[3px] border border-[#DFE1E6] bg-white p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-[#172B4D]">Email notifications</p>
						<p className="text-xs text-[#505F79]">
							Receive digest reports via email to all organization members.
						</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={channelEmail}
						disabled={!isOwner}
						onClick={handleEmailToggle}
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
			</div>

			{/* Slack */}
			<div className="rounded-[3px] border border-[#DFE1E6] bg-white p-4">
				<label htmlFor="channel-slack" className="mb-1 block text-sm font-medium text-[#172B4D]">
					Slack webhook URL
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
					<button
						type="button"
						onClick={handleSaveSlack}
						disabled={!canEditSlackDiscord || savingSlack || !channelSlack}
						className={btnPrimary}
					>
						{savingSlack ? "Saving..." : "Save"}
					</button>
					<button
						type="button"
						onClick={() => handleTestWebhook("slack")}
						disabled={!canEditSlackDiscord || testingSlack || !channelSlack}
						className={btnSecondary}
					>
						{testingSlack ? "Testing..." : "Test"}
					</button>
				</div>
				<p className="mt-1.5 text-xs text-[#97A0AF]">
					Open Slack &rarr; Apps &rarr; Incoming Webhooks &rarr; Add to Slack &rarr; choose a
					channel &rarr; copy the Webhook URL.
				</p>
				{!canSlackDiscord && (
					<p className="mt-1.5 text-xs text-[#FF8B00]">{slackDiscordUpgradeMessage}</p>
				)}
			</div>

			{/* Discord */}
			<div className="rounded-[3px] border border-[#DFE1E6] bg-white p-4">
				<label htmlFor="channel-discord" className="mb-1 block text-sm font-medium text-[#172B4D]">
					Discord webhook URL
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
					<button
						type="button"
						onClick={handleSaveDiscord}
						disabled={!canEditSlackDiscord || savingDiscord || !channelDiscord}
						className={btnPrimary}
					>
						{savingDiscord ? "Saving..." : "Save"}
					</button>
					<button
						type="button"
						onClick={() => handleTestWebhook("discord")}
						disabled={!canEditSlackDiscord || testingDiscord || !channelDiscord}
						className={btnSecondary}
					>
						{testingDiscord ? "Testing..." : "Test"}
					</button>
				</div>
				<p className="mt-1.5 text-xs text-[#97A0AF]">
					Open Discord &rarr; Server Settings &rarr; Integrations &rarr; Webhooks &rarr; New Webhook
					&rarr; choose a channel &rarr; copy the Webhook URL.
				</p>
				{!canSlackDiscord && (
					<p className="mt-1.5 text-xs text-[#FF8B00]">{slackDiscordUpgradeMessage}</p>
				)}
			</div>

			{/* Frequency */}
			<div className="rounded-[3px] border border-[#DFE1E6] bg-white p-4">
				<label htmlFor="digest-frequency" className="mb-1 block text-sm font-medium text-[#172B4D]">
					Digest frequency
				</label>
				<div className="flex gap-2">
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
					{isOwner && (
						<button
							type="button"
							onClick={handleSaveFrequency}
							disabled={savingFrequency}
							className={btnPrimary}
						>
							{savingFrequency ? "Saving..." : "Save"}
						</button>
					)}
				</div>
			</div>

			{toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
		</div>
	);
}
