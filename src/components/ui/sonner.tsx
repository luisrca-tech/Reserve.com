"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
	return (
		<SonnerToaster
			position="bottom-right"
			toastOptions={{
				style: {
					background: "var(--surface)",
					border: "1px solid var(--border)",
					color: "var(--text)",
					borderRadius: "var(--radius-sm)",
					boxShadow: "var(--shadow)",
					fontFamily: "var(--font-outfit), Outfit, sans-serif",
				},
			}}
		/>
	);
}
