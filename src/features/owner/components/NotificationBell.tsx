"use client";

import { Bell } from "lucide-react";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/Popover";
import { ownerCopy } from "../copy";
import type { NotificationTone } from "../NotificationManager";
import { useOwnerStore } from "../OwnerStoreContext";

const colorByTone: Record<NotificationTone, string> = {
	info: "text-accent",
	success: "text-green",
	warning: "text-red",
};

export function NotificationBell() {
	const { notifications, clearNotifications } = useOwnerStore();
	const count = notifications.length;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					aria-label={ownerCopy.notifications.title}
					className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--border)] bg-surface2 text-text2 transition-all duration-200 hover:border-accent hover:bg-accent-soft hover:text-accent"
					type="button"
				>
					<Bell size={16} />
					{count > 0 && (
						<span className="absolute top-[5px] right-[5px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-surface bg-accent px-1 font-bold text-[0.6rem] text-white">
							{count}
						</span>
					)}
				</button>
			</PopoverTrigger>

			<PopoverContent align="end" className="w-80 p-3">
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
								<span className={`mr-2 font-bold ${colorByTone[n.tone]}`}>
									•
								</span>
								<span className="text-text2">{n.message}</span>
							</li>
						))}
					</ul>
				)}
			</PopoverContent>
		</Popover>
	);
}
