"use client";

import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Minus,
	Plus,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/Button";
import type { RestaurantView } from "~/features/restaurant/types";
import { useSessionState } from "~/features/session/SessionContext";
import { createAvailability } from "../Availability";
import { bookingCopy } from "../copy";
import { useReservationStore } from "./ReservationStoreContext";

/** UTC midnight for a calendar cell — keeps weekday math consistent. */
function utcDay(year: number, month: number, day: number): Date {
	return new Date(Date.UTC(year, month, day));
}

function startOfTodayUtc(): Date {
	const now = new Date();
	return utcDay(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function buildMonthGrid(viewYear: number, viewMonth: number): (Date | null)[] {
	const first = utcDay(viewYear, viewMonth, 1);
	const lead = first.getUTCDay();
	const daysInMonth = new Date(
		Date.UTC(viewYear, viewMonth + 1, 0),
	).getUTCDate();
	const cells: (Date | null)[] = [];
	for (let i = 0; i < lead; i++) cells.push(null);
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push(utcDay(viewYear, viewMonth, d));
	}
	return cells;
}

export function BookingFlow({ restaurant }: { restaurant: RestaurantView }) {
	const { user } = useSessionState();
	const { restaurantReservations, addReservation } = useReservationStore();
	const reservations = restaurantReservations(restaurant.id);

	const today = useMemo(startOfTodayUtc, []);
	const [viewYear, setViewYear] = useState(today.getUTCFullYear());
	const [viewMonth, setViewMonth] = useState(today.getUTCMonth());
	const [calendarOpen, setCalendarOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedHour, setSelectedHour] = useState<number | null>(null);
	const [partySize, setPartySize] = useState(2);
	const [tableCount, setTableCount] = useState(1);
	const calendarRef = useRef<HTMLDivElement>(null);

	const grid = useMemo(
		() => buildMonthGrid(viewYear, viewMonth),
		[viewYear, viewMonth],
	);

	const openHours = selectedDate
		? (restaurant.hoursByWeekday[selectedDate.getUTCDay()] ?? [])
		: [];

	function isDayOpen(date: Date): boolean {
		return (restaurant.hoursByWeekday[date.getUTCDay()]?.length ?? 0) > 0;
	}

	function selectDate(date: Date) {
		setSelectedDate(date);
		setSelectedHour(null);
		setCalendarOpen(false);
	}

	function shiftMonth(delta: number) {
		const next = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
		setViewYear(next.getUTCFullYear());
		setViewMonth(next.getUTCMonth());
	}

	function slotStart(hour: number): Date {
		const d = selectedDate as Date;
		return new Date(
			Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour),
		);
	}

	const availability = useMemo(
		() =>
			createAvailability(reservations, {
				restaurantId: restaurant.id,
				tableCount: restaurant.tableCount,
				autoConfirmEnabled: restaurant.autoConfirmEnabled,
				lowTableThreshold: restaurant.lowTableThreshold,
				hoursByWeekday: restaurant.hoursByWeekday,
			}),
		[reservations, restaurant],
	);

	const selectedStart =
		selectedDate && selectedHour !== null ? slotStart(selectedHour) : null;

	const selectedSlot = selectedStart
		? availability.slotState(selectedStart)
		: null;
	const slotRemaining = selectedSlot?.remaining ?? 0;

	const canConfirm =
		Boolean(user) &&
		selectedStart !== null &&
		partySize >= 1 &&
		(selectedSlot?.canBook(tableCount) ?? false);

	function confirm() {
		if (!user) {
			toast.error(bookingCopy.loginRequired);
			return;
		}
		if (!selectedStart) return;
		addReservation({
			userId: user.id,
			restaurantId: restaurant.id,
			startTime: selectedStart,
			partySize,
			tableCount,
			autoConfirm: restaurant.autoConfirmEnabled,
		});
		toast.success(bookingCopy.confirmed);
		setSelectedDate(null);
		setSelectedHour(null);
		setPartySize(2);
		setTableCount(1);
	}

	const dateLabel = selectedDate
		? `${selectedDate.getUTCDate()} de ${bookingCopy.months[selectedDate.getUTCMonth()]} de ${selectedDate.getUTCFullYear()}`
		: bookingCopy.datePlaceholder;

	return (
		<div className="border-[var(--border)] border-t p-6">
			<h3 className="mb-4 font-semibold font-serif text-[1.4rem] text-text">
				{bookingCopy.title}
			</h3>

			{/* Step 1 — date */}
			<div className="mb-5">
				<div className="mb-2 text-[0.85rem] text-muted">
					{bookingCopy.stepDate}
				</div>
				<div className="relative" ref={calendarRef}>
					<button
						className="flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-3 text-[0.9rem] text-text transition-colors hover:border-accent"
						onClick={() => setCalendarOpen((o) => !o)}
						type="button"
					>
						<span className={selectedDate ? "text-text" : "text-muted"}>
							{dateLabel}
						</span>
						<CalendarDays className="text-muted" size={18} />
					</button>

					{calendarOpen && (
						<div className="absolute z-20 mt-2 w-[320px] rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4 shadow-xl">
							<div className="mb-3 flex items-center justify-between">
								<button
									className="rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-text"
									onClick={() => shiftMonth(-1)}
									type="button"
								>
									<ChevronLeft size={18} />
								</button>
								<span className="font-medium text-[0.9rem] text-text">
									{bookingCopy.months[viewMonth]} {viewYear}
								</span>
								<button
									className="rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-text"
									onClick={() => shiftMonth(1)}
									type="button"
								>
									<ChevronRight size={18} />
								</button>
							</div>
							<div className="mb-1 grid grid-cols-7 gap-1 text-center text-[0.7rem] text-muted">
								{bookingCopy.weekdays.map((w) => (
									<div key={w}>{w}</div>
								))}
							</div>
							<div className="grid grid-cols-7 gap-1">
								{grid.map((date, i) => {
									if (!date) {
										// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size leading blanks
										return <div key={`blank_${i}`} />;
									}
									const past = date.getTime() < today.getTime();
									const open = isDayOpen(date);
									const disabled = past || !open;
									const selected = selectedDate?.getTime() === date.getTime();
									return (
										<button
											className={`aspect-square rounded-md text-[0.8rem] transition-colors ${
												selected
													? "bg-accent text-white"
													: disabled
														? "cursor-not-allowed text-muted/40"
														: "text-text hover:bg-surface2"
											}`}
											disabled={disabled}
											key={date.toISOString()}
											onClick={() => selectDate(date)}
											type="button"
										>
											{date.getUTCDate()}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Step 2 — hour */}
			{selectedDate && (
				<div className="mb-5">
					<div className="mb-2 text-[0.85rem] text-muted">
						{bookingCopy.stepHour}
					</div>
					{openHours.length === 0 ? (
						<p className="text-[0.85rem] text-muted">{bookingCopy.noSlots}</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{openHours.map((hour) => {
								const full = availability.slotState(slotStart(hour)).isFull;
								const selected = selectedHour === hour;
								return (
									<button
										className={`rounded-full border px-4 py-2 text-[0.85rem] transition-colors ${
											selected
												? "border-accent bg-accent text-white"
												: full
													? "cursor-not-allowed border-[var(--border)] text-muted/50 line-through"
													: "border-[var(--border)] text-text hover:border-accent"
										}`}
										disabled={full}
										key={hour}
										onClick={() => setSelectedHour(hour)}
										type="button"
									>
										{`${String(hour).padStart(2, "0")}:00`}
										{full ? ` · ${bookingCopy.slotFull}` : ""}
									</button>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* Step 3 — party size */}
			{selectedHour !== null && (
				<div className="mb-5">
					<div className="mb-2 text-[0.85rem] text-muted">
						{bookingCopy.stepParty}
					</div>
					<Stepper
						label={bookingCopy.people(partySize)}
						min={1}
						onChange={setPartySize}
						value={partySize}
					/>
				</div>
			)}

			{/* Step 4 — table count */}
			{selectedHour !== null && (
				<div className="mb-5">
					<div className="mb-2 text-[0.85rem] text-muted">
						{bookingCopy.stepTables}
					</div>
					<Stepper
						label={bookingCopy.tables(tableCount)}
						max={Math.max(1, slotRemaining)}
						min={1}
						onChange={setTableCount}
						value={tableCount}
					/>
					<p className="mt-2 text-[0.78rem] text-muted">
						{bookingCopy.tablesRemaining(slotRemaining)}
					</p>
				</div>
			)}

			{/* Step 5 — confirm */}
			{selectedHour !== null && selectedStart && (
				<div className="mt-6 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 p-4">
					<div className="mb-3 text-[0.85rem] text-muted">
						{bookingCopy.stepConfirm}
					</div>
					<dl className="mb-4 grid grid-cols-2 gap-y-2 text-[0.85rem]">
						<dt className="text-muted">{bookingCopy.summaryDate}</dt>
						<dd className="text-right text-text">{dateLabel}</dd>
						<dt className="text-muted">{bookingCopy.summaryHour}</dt>
						<dd className="text-right text-text">
							{`${String(selectedHour).padStart(2, "0")}:00`}
						</dd>
						<dt className="text-muted">{bookingCopy.summaryParty}</dt>
						<dd className="text-right text-text">
							{bookingCopy.people(partySize)}
						</dd>
						<dt className="text-muted">{bookingCopy.summaryTables}</dt>
						<dd className="text-right text-text">
							{bookingCopy.tables(tableCount)}
						</dd>
					</dl>
					<Button
						className="w-full bg-[#1f9d55] text-white hover:bg-[#1a854790] disabled:opacity-50"
						disabled={!canConfirm}
						onClick={confirm}
						size="lg"
						type="button"
					>
						{bookingCopy.confirm}
					</Button>
				</div>
			)}
		</div>
	);
}

function Stepper({
	value,
	label,
	min = 1,
	max = 99,
	onChange,
}: {
	value: number;
	label: string;
	min?: number;
	max?: number;
	onChange: (next: number) => void;
}) {
	return (
		<div className="inline-flex items-center gap-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-2">
			<button
				className="rounded-md p-1 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
				disabled={value <= min}
				onClick={() => onChange(Math.max(min, value - 1))}
				type="button"
			>
				<Minus size={16} />
			</button>
			<span className="min-w-[7rem] text-center font-medium text-[0.9rem] text-text">
				{label}
			</span>
			<button
				className="rounded-md p-1 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
				disabled={value >= max}
				onClick={() => onChange(Math.min(max, value + 1))}
				type="button"
			>
				<Plus size={16} />
			</button>
		</div>
	);
}
