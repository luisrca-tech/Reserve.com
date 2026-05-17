import type { RestaurantView } from "~/features/restaurant/types";
import { createAvailability } from "~/server/domain/reservation";
import { ownerCopy } from "./copy";
import type { OwnerNotification } from "./NotificationManager";
import type { OwnerReservationView } from "./types";

/** A confirmed reservation starting within this window earns a reminder. */
const REMINDER_WINDOW_MS = 120 * 60 * 1000;

function timeLabel(date: Date): string {
	return `${String(date.getUTCHours()).padStart(2, "0")}:00`;
}

/**
 * Pure presentation derivation (story 26/27): pre-start reminders and
 * low-capacity warnings computed from the owner reservation query + the
 * restaurant settings. No side effects, no delivery channel — the panel
 * memoises this and renders the result in the header notification bell, so
 * it refreshes with the query (no polling, no realtime). Capacity is read
 * through the shared `createAvailability` so the warning can never disagree
 * with what the booking/owner views compute for the same slot.
 */
export function deriveOwnerNotifications(
	reservations: OwnerReservationView[],
	restaurant: RestaurantView,
	now: Date,
): OwnerNotification[] {
	const out: OwnerNotification[] = [];

	for (const r of reservations) {
		if (r.status !== "confirmed") continue;
		const delta = r.startTime.getTime() - now.getTime();
		if (delta <= 0 || delta > REMINDER_WINDOW_MS) continue;
		out.push({
			key: `reminder:${r.id}`,
			kind: "reminder",
			tone: "info",
			message: ownerCopy.notifications.reminder(
				r.guestName,
				timeLabel(r.startTime),
			),
			at: r.startTime,
		});
	}

	const availability = createAvailability(reservations, {
		restaurantId: restaurant.id,
		tableCount: restaurant.tableCount,
		autoConfirmEnabled: restaurant.autoConfirmEnabled,
		lowTableThreshold: restaurant.lowTableThreshold,
		hoursByWeekday: restaurant.hoursByWeekday,
	});

	for (const slot of availability.dayReport(now).slots) {
		if (slot.startTime.getTime() <= now.getTime()) continue;
		if (slot.isFull || !slot.isLow || slot.remaining <= 0) continue;
		out.push({
			key: `lowTables:${slot.startTime.getTime()}`,
			kind: "lowTables",
			tone: "warning",
			message: ownerCopy.notifications.lowTables(
				timeLabel(slot.startTime),
				slot.remaining,
			),
			at: slot.startTime,
		});
	}

	return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
