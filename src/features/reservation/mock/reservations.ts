import { mockUsers } from "~/features/auth/mock/users";
import { mockRestaurantViewsById } from "~/features/restaurant/mock/restaurants";
import { toReservationView } from "../mappers";
import type { Reservation } from "../types";

const CLIENT_ID = mockUsers.client.id;
const SEED_DATE = new Date("2026-01-01T12:00:00.000Z");

function reservation(
	id: string,
	restaurantId: string,
	start: string,
	status: Reservation["status"],
	partySize: number,
	tableCount: number,
): Reservation {
	const startTime = new Date(start);
	const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
	return {
		id,
		userId: CLIENT_ID,
		restaurantId,
		startTime,
		endTime,
		status,
		validatedAt: status === "confirmed" ? startTime : null,
		cancelledAt: status === "cancelled" ? startTime : null,
		createdAt: SEED_DATE,
		partySize,
		tableCount,
	};
}

export const mockReservations: Reservation[] = [
	reservation(
		"resv_active_bella",
		"rest_cantina_bella",
		"2026-06-01T20:00:00.000Z",
		"confirmed",
		4,
		2,
	),
	reservation(
		"resv_past_kai",
		"rest_sushi_kai",
		"2026-03-12T21:00:00.000Z",
		"completed",
		2,
		1,
	),
	reservation(
		"resv_past_brasa",
		"rest_brasa_viva",
		"2026-02-20T13:00:00.000Z",
		"cancelled",
		6,
		3,
	),
];

export const mockReservationViews = mockReservations.map((reservation) => {
	const restaurant = mockRestaurantViewsById[reservation.restaurantId];
	return toReservationView(
		reservation,
		restaurant && {
			name: restaurant.name,
			image: restaurant.images[0] ?? null,
		},
	);
});
