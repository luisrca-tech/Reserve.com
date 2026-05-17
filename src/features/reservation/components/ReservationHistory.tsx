"use client";

import { CalendarX, Clock, MapPin, Users, Utensils } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import { api } from "~/trpc/react";
import { bookingCopy, historyCopy, statusMeta } from "../copy";
import type { ReservationView } from "../types";

const ACTIVE_STATUSES: ReservationView["status"][] = ["pending", "confirmed"];

const toneClass: Record<string, string> = {
	accent: "bg-accent-soft text-accent",
	green: "bg-green-soft text-green",
	red: "bg-red-soft text-red",
	muted: "bg-surface2 text-muted",
};

function dateLabel(date: Date): string {
	return `${date.getUTCDate()} de ${
		bookingCopy.months[date.getUTCMonth()]
	} de ${date.getUTCFullYear()}`;
}

function timeLabel(date: Date): string {
	return `${String(date.getUTCHours()).padStart(2, "0")}:00`;
}

export function ReservationHistory() {
	const utils = api.useUtils();
	const [reservations] = api.reservation.list.useSuspenseQuery();

	// Optimistic: cancel in-flight → snapshot → patch cache → roll back
	// visibly on error → invalidate on settle. The server is the authority;
	// the patch only previews the same cancelled state it will return.
	const cancel = api.reservation.cancel.useMutation({
		async onMutate({ reservationId }) {
			await utils.reservation.list.cancel();
			const previous = utils.reservation.list.getData();
			utils.reservation.list.setData(undefined, (old) =>
				old?.map((r) =>
					r.id === reservationId ? { ...r, status: "cancelled" as const } : r,
				),
			);
			return { previous };
		},
		onError(_error, _vars, context) {
			utils.reservation.list.setData(undefined, context?.previous);
			toast.error(historyCopy.cancelError);
		},
		onSuccess() {
			toast.success(historyCopy.cancelled);
		},
	});

	const { active, previous } = useMemo(() => {
		const views = [...reservations].sort(
			(a, b) => b.startTime.getTime() - a.startTime.getTime(),
		);
		return {
			active: views.filter((v) => ACTIVE_STATUSES.includes(v.status)),
			previous: views.filter((v) => !ACTIVE_STATUSES.includes(v.status)),
		};
	}, [reservations]);

	function handleCancel(reservation: ReservationView) {
		cancel.mutate(
			{ reservationId: reservation.id },
			{
				async onSettled() {
					await Promise.all([
						utils.reservation.list.invalidate(),
						utils.restaurant.availability.invalidate({
							restaurantId: reservation.restaurantId,
						}),
					]);
				},
			},
		);
	}

	return (
		<main className="mx-auto w-full max-w-[920px] px-4 py-10 sm:px-8">
			<header className="mb-8">
				<h1 className="font-bold font-serif text-[2rem] text-text">
					{historyCopy.title}
				</h1>
				<p className="mt-1 text-muted text-sm">{historyCopy.subtitle}</p>
			</header>

			<section className="mb-10">
				<h2 className="mb-4 font-semibold text-[1.1rem] text-text">
					{historyCopy.activeTitle}
				</h2>
				{active.length === 0 ? (
					<div className="rounded-[var(--radius)] border border-[var(--border)] border-dashed bg-surface2 p-8 text-center">
						<CalendarX className="mx-auto mb-3 text-muted" size={32} />
						<p className="font-medium text-text">{historyCopy.noActiveTitle}</p>
						<p className="mt-1 text-muted text-sm">
							{historyCopy.noActiveHint}
						</p>
						<Button asChild className="mt-4" size="sm" variant="secondary">
							<Link href="/restaurants">{historyCopy.browseCta}</Link>
						</Button>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{active.map((r) => (
							<ReservationCard
								key={r.id}
								onCancel={() => handleCancel(r)}
								reservation={r}
							/>
						))}
					</div>
				)}
			</section>

			<section>
				<h2 className="mb-4 font-semibold text-[1.1rem] text-text">
					{historyCopy.previousTitle}
				</h2>
				{previous.length === 0 ? (
					<p className="text-muted text-sm">{historyCopy.noPrevious}</p>
				) : (
					<div className="flex flex-col gap-4">
						{previous.map((r) => (
							<ReservationCard key={r.id} reservation={r} />
						))}
					</div>
				)}
			</section>
		</main>
	);
}

function ReservationCard({
	reservation,
	onCancel,
}: {
	reservation: ReservationView;
	onCancel?: () => void;
}) {
	const meta = statusMeta[reservation.status];
	return (
		<article className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-5 sm:flex-row sm:items-center">
			{reservation.restaurantImage && (
				// biome-ignore lint/performance/noImgElement: remote/object storage urls
				<img
					alt={reservation.restaurantName}
					className="h-20 w-full rounded-[var(--radius-sm)] object-cover sm:h-20 sm:w-28"
					src={reservation.restaurantImage}
				/>
			)}
			<div className="flex-1">
				<div className="mb-2 flex items-center gap-3">
					<h3 className="font-semibold font-serif text-[1.15rem] text-text">
						{reservation.restaurantName}
					</h3>
					<span
						className={`rounded-full px-3 py-1 font-medium text-[0.72rem] ${toneClass[meta.tone]}`}
					>
						{meta.label}
					</span>
				</div>
				<div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.85rem] text-muted">
					<span className="inline-flex items-center gap-1.5">
						<MapPin size={14} />
						{dateLabel(reservation.startTime)}
					</span>
					<span className="inline-flex items-center gap-1.5">
						<Clock size={14} />
						{historyCopy.at} {timeLabel(reservation.startTime)}
					</span>
					<span className="inline-flex items-center gap-1.5">
						<Users size={14} />
						{historyCopy.people(reservation.partySize)}
					</span>
					<span className="inline-flex items-center gap-1.5">
						<Utensils size={14} />
						{historyCopy.tables(reservation.tableCount)}
					</span>
				</div>
			</div>
			{onCancel && (
				<Button
					className="shrink-0"
					onClick={onCancel}
					size="sm"
					type="button"
					variant="danger"
				>
					{historyCopy.cancel}
				</Button>
			)}
		</article>
	);
}
