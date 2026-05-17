import type { Reservation, ReservationView } from "./types";

/** The restaurant facts a reservation view needs, supplied by the caller. */
export interface ReservationRestaurantRef {
	name: string;
	image: string | null;
}

/**
 * Schema → view mapper. The restaurant reference is passed in (resolved by
 * the caller from its own source) so the mapper stays pure and free of any
 * restaurant data dependency.
 */
export function toReservationView(
	reservation: Reservation,
	restaurant?: ReservationRestaurantRef,
): ReservationView {
	return {
		id: reservation.id,
		restaurantId: reservation.restaurantId,
		restaurantName: restaurant?.name ?? "Restaurante",
		restaurantImage: restaurant?.image ?? null,
		startTime: reservation.startTime,
		endTime: reservation.endTime,
		status: reservation.status,
		partySize: reservation.partySize,
		tableCount: reservation.tableCount,
	};
}
