"use client";

import { useEffect, useState } from "react";

interface ToastProps {
	message: string;
	type: "success" | "error";
	onDismiss: () => void;
	duration?: number;
}

export function Toast({ message, type, onDismiss, duration = 3000 }: ToastProps) {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setVisible(false);
			setTimeout(onDismiss, 300);
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, onDismiss]);

	const bgColor =
		type === "success" ? "bg-[#E3FCEF] border-[#36B37E]" : "bg-[#FFEBE6] border-[#FF5630]";
	const textColor = type === "success" ? "text-[#006644]" : "text-[#BF2600]";

	return (
		<div
			className={`fixed top-4 right-4 z-50 rounded-[3px] border px-4 py-3 shadow-lg transition-all duration-300 ${bgColor} ${
				visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
			}`}
		>
			<p className={`text-sm font-medium ${textColor}`}>{message}</p>
		</div>
	);
}
