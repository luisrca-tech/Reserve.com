import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as schema from "../schema";
import { reservation, restaurant, user } from "../schema";
import { slugToUuid } from "./slugToUuid";
import { CLIENT_ACCOUNT_EMAIL } from "./users";

type Database = PostgresJsDatabase<typeof schema>;
type ReservationStatus =
	(typeof schema.reservation.status.enumValues)[number];

export interface ReservationSpec {
	slug: string;
	restaurantSlug: string;
	status: ReservationStatus;
	/** Days relative to `now` — negative = past, positive = upcoming. */
	dayOffset: number;
	/** Local hour of day the booking starts. */
	hour: number;
	durationMinutes: number;
}

const DEFAULT_DURATION = 90;

/**
 * Fixed reservations for the test client. The seed owns these copies; it never
 * imports from `src/features/*​/mock`. Identity is the stable `slug`, so
 * re-running upserts the same rows even though times re-anchor to `now`.
 */
export function buildReservationSpecs(): ReservationSpec[] {
	const base = (
		slug: string,
		restaurantSlug: string,
		status: ReservationStatus,
		dayOffset: number,
		hour: number,
	): ReservationSpec => ({
		slug,
		restaurantSlug,
		status,
		dayOffset,
		hour,
		durationMinutes: DEFAULT_DURATION,
	});

	return [
		base("resv_cantina_pending_upcoming", "rest_cantina_bella", "pending", 3, 20),
		base("resv_cantina_confirmed_upcoming", "rest_cantina_bella", "confirmed", 7, 21),
		base("resv_cantina_confirmed_past", "rest_cantina_bella", "confirmed", -10, 20),
		base("resv_cantina_pending_past", "rest_cantina_bella", "pending", -2, 19),
		base("resv_sushi_pending_upcoming", "rest_sushi_kai", "pending", 2, 19),
		base("resv_sushi_cancelled_upcoming", "rest_sushi_kai", "cancelled", 5, 20),
		base("resv_brasa_confirmed_upcoming", "rest_brasa_viva", "confirmed", 14, 13),
		base("resv_brasa_cancelled_past", "rest_brasa_viva", "cancelled", -4, 14),
	];
}

export function resolveReservationWindow(
	spec: ReservationSpec,
	now: Date,
): { startTime: Date; endTime: Date } {
	const startTime = new Date(now);
	startTime.setHours(spec.hour, 0, 0, 0);
	startTime.setDate(startTime.getDate() + spec.dayOffset);

	const endTime = new Date(startTime.getTime() + spec.durationMinutes * 60_000);
	return { startTime, endTime };
}

async function clientUserId(db: Database): Promise<string> {
	const [row] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, CLIENT_ACCOUNT_EMAIL))
		.limit(1);
	if (!row) {
		throw new Error(
			`Client account ${CLIENT_ACCOUNT_EMAIL} not found. Run the users seeder first.`,
		);
	}
	return row.id;
}

export async function seedReservations(db: Database): Promise<void> {
	const userId = await clientUserId(db);
	const now = new Date();
	const specs = buildReservationSpecs();

	const restaurantSlugs = [...new Set(specs.map((s) => s.restaurantSlug))];
	for (const slug of restaurantSlugs) {
		const [row] = await db
			.select({ id: restaurant.id })
			.from(restaurant)
			.where(eq(restaurant.id, slugToUuid(slug)))
			.limit(1);
		if (!row) {
			throw new Error(
				`Restaurant ${slug} not found. Run the restaurants seeder first.`,
			);
		}
	}

	for (const spec of specs) {
		const { startTime, endTime } = resolveReservationWindow(spec, now);
		await db
			.insert(reservation)
			.values({
				id: slugToUuid(spec.slug),
				userId,
				restaurantId: slugToUuid(spec.restaurantSlug),
				startTime,
				endTime,
				status: spec.status,
				validatedAt: spec.status === "confirmed" ? new Date(now) : null,
				cancelledAt: spec.status === "cancelled" ? new Date(now) : null,
			})
			.onConflictDoUpdate({
				target: reservation.id,
				set: {
					restaurantId: sql`excluded.restaurant_id`,
					startTime: sql`excluded.start_time`,
					endTime: sql`excluded.end_time`,
					status: sql`excluded.status`,
					validatedAt: sql`excluded.validated_at`,
					cancelledAt: sql`excluded.cancelled_at`,
				},
			});
	}

	console.log(`  reservations: ${specs.length} upserted`);
}
