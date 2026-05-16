"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

import { ownerCopy } from "../copy";
import { type NotificationKind, useOwnerStore } from "../OwnerStoreContext";

const toneByKind: Record<NotificationKind, string> = {
	reminder: "text-accent",
	expired: "text-red",
	lowTables: "text-red",
	auto: "text-green",
};

export function NotificationBell() {
	const { notifications, clearNotifications } = useOwnerStore();
	const [open, setOpen] = useState(false);
	const count = notifications.length;

	return (
		<div className="relative">
			<button
				aria-label={ownerCopy.notifications.title}
				className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--border)] bg-surface2 text-text2 transition-all duration-200 hover:border-accent hover:bg-accent-soft hover:text-accent"
				onClick={() => setOpen((o) => !o)}
				type="button"
			>
				<Bell size={16} />
				{count > 0 && (
					<span className="absolute top-[5px] right-[5px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-surface bg-accent px-1 font-bold text-[0.6rem] text-white">
						{count}
					</span>
				)}
			</button>

			{open && (
				<>
					<button
						aria-hidden
						className="fixed inset-0 z-[210] cursor-default"
						onClick={() => setOpen(false)}
						tabIndex={-1}
						type="button"
					/>
					<div className="absolute right-0 z-[220] mt-2 w-80 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface p-3 shadow-[var(--shadow)]">
						<div className="flex items-center justify-between border-[var(--border)] border-b px-1 pb-2">
							<span className="font-semibold text-sm text-text">
								{ownerCopy.notifications.title}
							</span>
							{count > 0 && (
								<button
									className="text-muted text-xs transition-colors hover:text-text"
									onClick={clearNotifications}
									type="button"
								>
									{ownerCopy.notifications.clear}
								</button>
							)}
						</div>
						{count === 0 ? (
							<p className="px-1 py-6 text-center text-muted text-sm">
								{ownerCopy.notifications.empty}
							</p>
						) : (
							<ul className="mt-1 flex max-h-80 flex-col gap-1 overflow-y-auto">
								{notifications.map((n) => (
									<li
										className="rounded-md px-2 py-2 text-sm transition-colors hover:bg-surface2"
										key={n.key}
									>
										<span className={`mr-2 font-bold ${toneByKind[n.kind]}`}>
											•
										</span>
										<span className="text-text2">{n.message}</span>
									</li>
								))}
							</ul>
						)}
					</div>
				</>
			)}
		</div>
	);
}
