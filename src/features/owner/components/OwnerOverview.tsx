"use client";

import { CalendarCheck, CheckCircle2, Clock, Utensils } from "lucide-react";
import { useMemo } from "react";

import { statusMeta } from "~/features/reservation/copy";
import { ownerCopy } from "../copy";
import { useOwnerStore } from "../OwnerStoreContext";

const toneClass: Record<string, string> = {
	accent: "bg-accent-soft text-accent",
	green: "bg-green-soft text-green",
	red: "bg-red-soft text-red",
	muted: "bg-surface2 text-muted",
};

function sameUtcDay(a: Date, b: Date): boolean {
	return (
		a.getUTCFullYear() === b.getUTCFullYear() &&
		a.getUTCMonth() === b.getUTCMonth() &&
		a.getUTCDate() === b.getUTCDate()
	);
}

function timeLabel(date: Date): string {
	return `${String(date.getUTCHours()).padStart(2, "0")}:00`;
}

export function OwnerOverview() {
	const { restaurant, reservations } = useOwnerStore();

	const { today, pending, confirmedToday } = useMemo(() => {
		const now = new Date();
		const todays = reservations
			.filter((r) => sameUtcDay(r.startTime, now))
			.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
		return {
			today: todays,
			pending: reservations.filter((r) => r.status === "pending").length,
			confirmedToday: todays.filter((r) => r.status === "confirmed").length,
		};
	}, [reservations]);

	const stats = [
		{
			label: ownerCopy.overview.statTables,
			value: restaurant.tableCount,
			Icon: Utensils,
		},
		{
			label: ownerCopy.overview.statToday,
			value: today.length,
			Icon: CalendarCheck,
		},
		{
			label: ownerCopy.overview.statPending,
			value: pending,
			Icon: Clock,
		},
		{
			label: ownerCopy.overview.statConfirmed,
			value: confirmedToday,
			Icon: CheckCircle2,
		},
	];

	return (
		<div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-8">
			<header className="mb-8">
				<h1 className="font-bold font-serif text-[2rem] text-text">
					{ownerCopy.overview.title}
				</h1>
				<p className="mt-1 text-muted text-sm">{ownerCopy.overview.subtitle}</p>
			</header>

			<div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
				{stats.map(({ label, value, Icon }) => (
					<div
						className="rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5"
						key={label}
					>
						<Icon className="mb-3 text-accent" size={22} />
						<div className="font-bold font-serif text-[2rem] text-text">
							{value}
						</div>
						<div className="mt-1 text-muted text-xs">{label}</div>
					</div>
				))}
			</div>

			<section>
				<h2 className="mb-4 font-semibold text-[1.1rem] text-text">
					{ownerCopy.overview.todayTitle}
				</h2>
				{today.length === 0 ? (
					<p className="rounded-[var(--radius)] border border-[var(--border)] border-dashed bg-surface2 p-8 text-center text-muted text-sm">
						{ownerCopy.overview.todayEmpty}
					</p>
				) : (
					<div className="flex flex-col gap-3">
						{today.map((r) => {
							const meta = statusMeta[r.status];
							return (
								<article
									className="flex flex-wrap items-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4"
									key={r.id}
								>
									<span className="font-semibold font-serif text-[1.05rem] text-text">
										{timeLabel(r.startTime)}
									</span>
									<span className="text-sm text-text2">{r.guestName}</span>
									<span className="text-muted text-sm">
										{ownerCopy.reservations.people(r.partySize)} ·{" "}
										{ownerCopy.reservations.tables(r.tableCount)}
									</span>
									<span
										className={`ml-auto rounded-full px-3 py-1 font-medium text-[0.72rem] ${toneClass[meta.tone]}`}
									>
										{meta.label}
									</span>
								</article>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
}
