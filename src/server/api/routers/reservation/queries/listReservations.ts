import { eq } from "drizzle-orm";

import { toReservationView } from "~/features/reservation/mappers";
import type { ReservationView } from "~/features/reservation/types";
import { protectedProcedure } from "~/server/api/trpc";
import { reservation } from "~/server/db/schema";
import { nextStates } from "~/server/domain/reservation";

interface ImageRef {
	sortOrder: number;
	asset: { url: string } | null;
}

function firstImageUrl(images: ImageRef[]): string | null {
	return (
		[...images]
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((img) => img.asset?.url)
			.find((url): url is string => Boolean(url)) ?? null
	);
}

/**
 * The signed-in guest's own reservations across past and upcoming windows,
 * as finished view models. Lifecycle expiry is derived on read (story 28)
 * through the shared domain module — a stale pending hold reads as expired,
 * or is promoted if its restaurant auto-confirms — so the history reflects
 * server truth without a write. Newest first.
 */
export const listReservations = protectedProcedure.query(
	async ({ ctx }): Promise<ReservationView[]> => {
		const rows = await ctx.db.query.reservation.findMany({
			where: eq(reservation.userId, ctx.session.user.id),
			with: {
				restaurant: { with: { images: { with: { asset: true } } } },
			},
		});

		const autoConfirmByRestaurant = new Map<string, boolean>();
		const restaurantByReservation = new Map<
			string,
			(typeof rows)[number]["restaurant"]
		>();
		for (const row of rows) {
			autoConfirmByRestaurant.set(
				row.restaurantId,
				row.restaurant?.autoConfirmEnabled ?? false,
			);
			restaurantByReservation.set(row.id, row.restaurant);
		}

		const { reservations: derived } = nextStates({
			now: new Date(),
			reservations: rows,
			autoConfirm: (restaurantId) =>
				autoConfirmByRestaurant.get(restaurantId) ?? false,
		});

		return derived
			.map((r) => {
				const rest = restaurantByReservation.get(r.id);
				return toReservationView(
					r,
					rest
						? { name: rest.name, image: firstImageUrl(rest.images) }
						: undefined,
				);
			})
			.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
	},
);
