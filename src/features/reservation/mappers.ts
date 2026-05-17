import { mockRestaurantViewsById } from "~/features/restaurant/mock/restaurants";
import type { Reservation, ReservationView } from "./types";

/** Schema → view mapper: joins a reservation row to its restaurant. */
export function toReservationView(
	reservation: Reservation,
): ReservationView {
	const restaurant = mockRestaurantViewsById[reservation.restaurantId];
	return {
		id: reservation.id,
		restaurantId: reservation.restaurantId,
		restaurantName: restaurant?.name ?? "Restaurante",
		restaurantImage: restaurant?.images[0] ?? null,
		startTime: reservation.startTime,
		endTime: reservation.endTime,
		status: reservation.status,
		partySize: reservation.partySize,
		tableCount: reservation.tableCount,
	};
}
