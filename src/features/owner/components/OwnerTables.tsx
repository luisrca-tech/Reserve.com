"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import { Label } from "~/components/ui/Label";
import { createAvailability } from "~/server/domain/reservation";
import { ownerCopy } from "../copy";
import { useOwnerStore } from "../OwnerStoreContext";

function todayInputValue(): string {
	const now = new Date();
	const y = now.getUTCFullYear();
	const m = String(now.getUTCMonth() + 1).padStart(2, "0");
	const d = String(now.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function parseInputDate(value: string): Date {
	const [y, m, d] = value.split("-").map(Number);
	return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12));
}

export function OwnerTables() {
	const { restaurant, reservations, saveTableCount } = useOwnerStore();
	const [dateValue, setDateValue] = useState(todayInputValue);
	const [draftCount, setDraftCount] = useState(restaurant.tableCount);

	const selected = useMemo(() => parseInputDate(dateValue), [dateValue]);

	const report = useMemo(
		() =>
			createAvailability(reservations, {
				restaurantId: restaurant.id,
				tableCount: restaurant.tableCount,
				autoConfirmEnabled: restaurant.autoConfirmEnabled,
				lowTableThreshold: restaurant.lowTableThreshold,
				hoursByWeekday: restaurant.hoursByWeekday,
			}).dayReport(selected),
		[reservations, restaurant, selected],
	);
	const openHours = report.openHours;

	function handleSave() {
		saveTableCount(draftCount);
		toast.success(ownerCopy.tables.saved);
	}

	return (
		<div className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-8">
			<header className="mb-8">
				<h1 className="font-bold font-serif text-[2rem] text-text">
					{ownerCopy.tables.title}
				</h1>
				<p className="mt-1 text-muted text-sm">{ownerCopy.tables.subtitle}</p>
			</header>

			<section className="mb-10 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-6">
				<div className="mb-5">
					<Label htmlFor="tables-date">{ownerCopy.tables.dateLabel}</Label>
					<input
						className="mt-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-2.5 text-[0.9rem] text-text focus:border-accent focus:outline-none"
						id="tables-date"
						onChange={(e) => setDateValue(e.target.value)}
						type="date"
						value={dateValue}
					/>
				</div>

				<h2 className="mb-3 font-semibold text-[1rem] text-text">
					{ownerCopy.tables.usageTitle}
				</h2>
				{openHours.length === 0 ? (
					<p className="rounded-[var(--radius-sm)] border border-[var(--border)] border-dashed bg-surface2 p-6 text-center text-muted text-sm">
						{ownerCopy.tables.closedDay}
					</p>
				) : (
					<div className="flex flex-col gap-2">
						{report.slots.map((slot) => {
							const hour = slot.startTime.getUTCHours();
							const { used, remaining: free, isFull } = slot;
							const pct = Math.min(
								100,
								Math.round((used / restaurant.tableCount) * 100),
							);
							return (
								<div
									className="flex items-center gap-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-3"
									key={hour}
								>
									<span className="w-14 font-medium text-[0.85rem] text-text">
										{ownerCopy.settings.hourValue(hour)}
									</span>
									<div className="h-2 flex-1 overflow-hidden rounded-full bg-surface3">
										<div
											className={`h-full rounded-full ${isFull ? "bg-red" : "bg-accent"}`}
											style={{ width: `${pct}%` }}
										/>
									</div>
									<span className="w-24 text-right text-[0.8rem] text-muted">
										{ownerCopy.tables.used(used, restaurant.tableCount)}
									</span>
									<span
										className={`w-24 text-right text-[0.78rem] ${isFull ? "text-red" : "text-green"}`}
									>
										{isFull
											? ownerCopy.tables.full
											: ownerCopy.tables.free(free)}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</section>

			<section className="rounded-[var(--radius)] border border-[var(--border)] bg-surface p-6">
				<h2 className="font-semibold text-[1rem] text-text">
					{ownerCopy.tables.capacityTitle}
				</h2>
				<p className="mt-1 mb-4 text-muted text-sm">
					{ownerCopy.tables.capacityHint}
				</p>
				<div className="flex flex-wrap items-center gap-4">
					<div className="inline-flex items-center gap-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-2">
						<button
							className="rounded-md p-1 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
							disabled={draftCount <= 1}
							onClick={() => setDraftCount((c) => Math.max(1, c - 1))}
							type="button"
						>
							<Minus size={16} />
						</button>
						<span className="min-w-[6rem] text-center font-medium text-[0.9rem] text-text">
							{ownerCopy.tables.tableCountValue(draftCount)}
						</span>
						<button
							className="rounded-md p-1 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
							disabled={draftCount >= 999}
							onClick={() => setDraftCount((c) => Math.min(999, c + 1))}
							type="button"
						>
							<Plus size={16} />
						</button>
					</div>
					<Button
						disabled={draftCount === restaurant.tableCount}
						onClick={handleSave}
						type="button"
					>
						{ownerCopy.tables.save}
					</Button>
				</div>
			</section>
		</div>
	);
}
