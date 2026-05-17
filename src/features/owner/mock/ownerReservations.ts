import { mockUsersById } from "~/features/auth/mock/users";
import type { Reservation } from "~/features/reservation/types";
import type { RestaurantView } from "~/features/restaurant/types";

/** Synthetic guests for owner demo rows that are not seeded `user` rows. */
const guestProfiles: Record<string, { name: string; phone: string }> = {
	guest_helena: { name: "Helena Prado", phone: "(11) 9 7777-1212" },
	guest_diego: { name: "Diego Martins", phone: "(11) 9 6543-8800" },
	guest_sofia: { name: "Sofia Ribeiro", phone: "(11) 9 4001-5566" },
};

/** Display name + phone for a reservation's user, seeded users included. */
export function reservationGuest(userId: string): {
	name: string;
	phone: string;
} {
	const user = mockUsersById[userId];
	if (user) return { name: user.name, phone: user.phone ?? "—" };
	const guest = guestProfiles[userId];
	return guest ?? { name: "Cliente", phone: "—" };
}

function atUtc(base: Date, hour: number, dayOffset = 0): Date {
	const d = new Date(base);
	d.setUTCDate(d.getUTCDate() + dayOffset);
	d.setUTCHours(hour, 0, 0, 0);
	return d;
}

/** First date on/after `from` whose UTC weekday the restaurant is open. */
function nextOpenDate(restaurant: RestaurantView, from: Date): Date {
	for (let offset = 0; offset < 7; offset++) {
		const candidate = atUtc(from, 12, offset);
		if ((restaurant.hoursByWeekday[candidate.getUTCDay()]?.length ?? 0) > 0) {
			return candidate;
		}
	}
	return atUtc(from, 12, 0);
}

function reservation(
	id: string,
	userId: string,
	restaurantId: string,
	startTime: Date,
	status: Reservation["status"],
	partySize: number,
	tableCount: number,
	createdAt: Date,
): Reservation {
	return {
		id,
		userId,
		restaurantId,
		startTime,
		endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
		status,
		validatedAt: status === "confirmed" ? createdAt : null,
		cancelledAt: null,
		createdAt,
		partySize,
		tableCount,
	};
}

/**
 * Demo reservations for the owner's restaurant, built relative to `now` so
 * pending rows are fresh (validate-able, not instantly expired) and the
 * busy slot pushes capacity near the low-tables threshold for alerts.
 */
export function buildOwnerSeed(
	restaurant: RestaurantView,
	now: Date,
): Reservation[] {
	const day = nextOpenDate(restaurant, now);
	const openHours = restaurant.hoursByWeekday[day.getUTCDay()] ?? [];
	const firstHour = openHours[0] ?? 19;
	const secondHour = openHours[1] ?? firstHour + 1;

	const busyHour = atUtc(day, firstHour);
	const lateHour = atUtc(day, secondHour);
	const nearThreshold = Math.max(
		1,
		restaurant.tableCount - restaurant.lowTableThreshold + 1,
	);

	return [
		reservation(
			"resv_owner_busy",
			"guest_helena",
			restaurant.id,
			busyHour,
			"confirmed",
			Math.min(restaurant.tableCount, 12),
			nearThreshold,
			now,
		),
		reservation(
			"resv_owner_pending_a",
			"guest_diego",
			restaurant.id,
			busyHour,
			"pending",
			4,
			2,
			now,
		),
		reservation(
			"resv_owner_pending_b",
			"guest_sofia",
			restaurant.id,
			lateHour,
			"pending",
			2,
			1,
			now,
		),
	];
}
