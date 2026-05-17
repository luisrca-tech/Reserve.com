"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import { statusMeta } from "~/features/reservation/copy";
import type { ReservationView } from "~/features/reservation/types";
import { api } from "~/trpc/react";
import { ownerCopy } from "../copy";
import { useOwnerStore } from "../OwnerStoreContext";
import type { OwnerReservationView } from "../types";

type Status = ReservationView["status"];

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
	const { restaurant, reservations, setAutoConfirm } = useOwnerStore();
	const utils = api.useUtils();

	const ordered = useMemo(
		() =>
			[...reservations].sort(
				(a, b) => b.startTime.getTime() - a.startTime.getTime(),
			),
		[reservations],
	);

	// Optimistic per the contract: cancel in-flight → snapshot → patch the
	// owner.reservations cache to the same status the server will return →
	// roll back visibly on error → invalidate the three contract queries on
	// settle. The server is the authority; the patch only previews its result.
	function optimistic(next: Status, errorMessage: string) {
		return {
			async onMutate({ reservationId }: { reservationId: string }) {
				await utils.owner.reservations.cancel();
				const previous = utils.owner.reservations.getData();
				utils.owner.reservations.setData(undefined, (old) =>
					old?.map((r) =>
						r.id === reservationId ? { ...r, status: next } : r,
					),
				);
				return { previous };
			},
			onError(
				_error: unknown,
				_vars: { reservationId: string },
				context?: { previous?: OwnerReservationView[] },
			) {
				utils.owner.reservations.setData(undefined, context?.previous);
				toast.error(errorMessage);
			},
		};
	}

	const confirm = api.owner.confirmReservation.useMutation({
		...optimistic("confirmed", ownerCopy.reservations.confirmError),
		onSuccess() {
			toast.success(ownerCopy.reservations.confirmed);
		},
	});
	const cancel = api.owner.cancelReservation.useMutation({
		...optimistic("cancelled", ownerCopy.reservations.cancelError),
		onSuccess() {
			toast.success(ownerCopy.reservations.cancelled);
		},
	});
	const markComplete = api.owner.completeReservation.useMutation({
		...optimistic("completed", ownerCopy.reservations.completeError),
		onSuccess() {
			toast.success(ownerCopy.reservations.completed);
		},
	});

	function settle(restaurantId: string) {
		return {
			async onSettled() {
				await Promise.all([
					utils.owner.reservations.invalidate(),
					utils.restaurant.availability.invalidate({ restaurantId }),
					utils.reservation.list.invalidate(),
				]);
			},
		};
	}

	function handleConfirm(r: OwnerReservationView) {
		confirm.mutate({ reservationId: r.id }, settle(r.restaurantId));
	}

	function handleCancel(r: OwnerReservationView) {
		cancel.mutate({ reservationId: r.id }, settle(r.restaurantId));
	}

	function handleComplete(r: OwnerReservationView) {
		markComplete.mutate({ reservationId: r.id }, settle(r.restaurantId));
	}

	const busy = confirm.isPending || cancel.isPending || markComplete.isPending;

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
								const meta = statusMeta[r.status];
								return (
									<tr
										className="border-[var(--border)] border-b last:border-0"
										key={r.id}
									>
										<td className="px-4 py-3 font-medium text-text">
											{r.guestName}
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
										<td className="px-4 py-3 text-text2">{r.guestPhone}</td>
										<td className="px-4 py-3">
											<span
												className={`rounded-full px-3 py-1 font-medium text-[0.72rem] ${toneClass[meta.tone]}`}
											>
												{meta.label}
											</span>
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex justify-end gap-2">
												{r.status === "pending" && (
													<Button
														disabled={busy}
														onClick={() => handleConfirm(r)}
														size="sm"
														type="button"
														variant="success"
													>
														{ownerCopy.reservations.confirm}
													</Button>
												)}
												{r.status === "confirmed" && (
													<Button
														disabled={busy}
														onClick={() => handleComplete(r)}
														size="sm"
														type="button"
														variant="success"
													>
														{ownerCopy.reservations.complete}
													</Button>
												)}
												{(r.status === "pending" ||
													r.status === "confirmed") && (
													<Button
														disabled={busy}
														onClick={() => handleCancel(r)}
														size="sm"
														type="button"
														variant="danger"
													>
														{ownerCopy.reservations.cancel}
													</Button>
												)}
											</div>
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
