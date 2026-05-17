import type {
	Reservation,
	RestaurantAvailability,
} from "~/server/db/schema/types";

/** Statuses that hold a table and therefore count against slot capacity. */
export const ACTIVE_STATUSES = ["pending", "confirmed"] as const;

/** Minimal structural shape capacity math needs from a reservation. */
export interface CapacityReservation {
	restaurantId: string;
	startTime: Date;
	tableCount: number;
	status: Reservation["status"];
}

type AvailabilityRow = Pick<RestaurantAvailability, "weekday" | "hour">;

function isActive(status: Reservation["status"]): boolean {
	return (ACTIVE_STATUSES as readonly string[]).includes(status);
}

/** Sorted, de-duplicated open whole hours for a single weekday (0–6). */
export function openHoursForWeekday(
	availability: AvailabilityRow[],
	weekday: number,
): number[] {
	const hours = new Set<number>();
	for (const row of availability) {
		if (row.weekday === weekday) hours.add(row.hour);
	}
	return [...hours].sort((a, b) => a - b);
}

/** Open hours for the weekday the given date falls on (UTC). */
export function availableHoursForDate(
	availability: AvailabilityRow[],
	date: Date,
): number[] {
	return openHoursForWeekday(availability, date.getUTCDay());
}

/** SUM of tableCount for active reservations sharing `(restaurantId, startTime)`. */
export function slotUsage(
	reservations: CapacityReservation[],
	restaurantId: string,
	startTime: Date,
): number {
	const slot = startTime.getTime();
	let used = 0;
	for (const r of reservations) {
		if (
			r.restaurantId === restaurantId &&
			r.startTime.getTime() === slot &&
			isActive(r.status)
		) {
			used += r.tableCount;
		}
	}
	return used;
}

/** Tables still bookable in the slot, floored at 0. */
export function remainingTables(
	reservations: CapacityReservation[],
	restaurantId: string,
	startTime: Date,
	tableCount: number,
): number {
	return Math.max(
		0,
		tableCount - slotUsage(reservations, restaurantId, startTime),
	);
}

/** A slot is full once active usage reaches the restaurant's table count. */
export function isSlotFull(
	reservations: CapacityReservation[],
	restaurantId: string,
	startTime: Date,
	tableCount: number,
): boolean {
	return slotUsage(reservations, restaurantId, startTime) >= tableCount;
}
