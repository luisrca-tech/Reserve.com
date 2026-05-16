"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import { statusMeta } from "~/features/reservation/copy";
import { ownerCopy } from "../copy";
import { reservationGuest } from "../mock/ownerReservations";
import { useOwnerStore } from "../OwnerStoreContext";

const toneClass: Record<string, string> = {
	accent: "bg-accent-soft text-accent",
	green: "bg-green-soft text-green",
	red: "bg-red-soft text-red",
	muted: "bg-surface2 text-muted",
};

function whenLabel(date: Date): string {
	const day = String(date.getUTCDate()).padStart(2, "0");
	const month = ownerCopy.months[date.getUTCMonth()];
	const time = `${String(date.getUTCHours()).padStart(2, "0")}:00`;
	return `${day} de ${month} ${ownerCopy.reservations.at} ${time}`;
}

export function OwnerReservations() {
	const { restaurant, reservations, validateReservation, setAutoConfirm } =
		useOwnerStore();

	const ordered = useMemo(
		() =>
			[...reservations].sort(
				(a, b) => b.startTime.getTime() - a.startTime.getTime(),
			),
		[reservations],
	);

	function handleValidate(id: string) {
		validateReservation(id);
		toast.success(ownerCopy.reservations.validated);
	}

	function handleToggle(next: boolean) {
		setAutoConfirm(next);
		toast.info(
			next
				? ownerCopy.reservations.autoConfirmOn
				: ownerCopy.reservations.autoConfirmOff,
		);
	}

	return (
		<div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-8">
			<header className="mb-6">
				<h1 className="font-bold font-serif text-[2rem] text-text">
					{ownerCopy.reservations.title}
				</h1>
				<p className="mt-1 text-muted text-sm">
					{ownerCopy.reservations.subtitle}
				</p>
			</header>

			<div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5">
				<div>
					<div className="font-semibold text-[0.95rem] text-text">
						{ownerCopy.reservations.autoConfirmLabel}
					</div>
					<div className="mt-0.5 text-muted text-xs">
						{ownerCopy.reservations.autoConfirmHint}
					</div>
				</div>
				<button
					aria-label={ownerCopy.reservations.autoConfirmLabel}
					aria-pressed={restaurant.autoConfirmEnabled}
					className={`relative h-7 w-12 rounded-full transition-colors ${
						restaurant.autoConfirmEnabled ? "bg-accent" : "bg-surface3"
					}`}
					onClick={() => handleToggle(!restaurant.autoConfirmEnabled)}
					type="button"
				>
					<span
						className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
							restaurant.autoConfirmEnabled ? "translate-x-6" : "translate-x-1"
						}`}
					/>
				</button>
			</div>

			{ordered.length === 0 ? (
				<p className="rounded-[var(--radius)] border border-[var(--border)] border-dashed bg-surface2 p-8 text-center text-muted text-sm">
					{ownerCopy.reservations.empty}
				</p>
			) : (
				<div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
					<table className="w-full min-w-[760px] border-collapse text-left text-sm">
						<thead>
							<tr className="border-[var(--border)] border-b bg-surface2 text-muted text-xs uppercase tracking-wide">
								<th className="px-4 py-3 font-medium">
									{ownerCopy.reservations.colClient}
								</th>
								<th className="px-4 py-3 font-medium">
									{ownerCopy.reservations.colWhen}
								</th>
								<th className="px-4 py-3 font-medium">
									{ownerCopy.reservations.colParty}
								</th>
								<th className="px-4 py-3 font-medium">
									{ownerCopy.reservations.colTables}
								</th>
								<th className="px-4 py-3 font-medium">
									{ownerCopy.reservations.colPhone}
								</th>
								<th className="px-4 py-3 font-medium">
									{ownerCopy.reservations.colStatus}
								</th>
								<th className="px-4 py-3" />
							</tr>
						</thead>
						<tbody>
							{ordered.map((r) => {
								const guest = reservationGuest(r.userId);
								const meta = statusMeta[r.status];
								return (
									<tr
										className="border-[var(--border)] border-b last:border-0"
										key={r.id}
									>
										<td className="px-4 py-3 font-medium text-text">
											{guest.name}
										</td>
										<td className="px-4 py-3 text-text2">
											{whenLabel(r.startTime)}
										</td>
										<td className="px-4 py-3 text-text2">
											{ownerCopy.reservations.people(r.partySize)}
										</td>
										<td className="px-4 py-3 text-text2">
											{ownerCopy.reservations.tables(r.tableCount)}
										</td>
										<td className="px-4 py-3 text-text2">{guest.phone}</td>
										<td className="px-4 py-3">
											<span
												className={`rounded-full px-3 py-1 font-medium text-[0.72rem] ${toneClass[meta.tone]}`}
											>
												{meta.label}
											</span>
										</td>
										<td className="px-4 py-3 text-right">
											{r.status === "pending" && (
												<Button
													onClick={() => handleValidate(r.id)}
													size="sm"
													type="button"
													variant="success"
												>
													{ownerCopy.reservations.validate}
												</Button>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
