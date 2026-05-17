import { z } from "zod";

/**
 * Single source of truth for the create-reservation contract, imported by the
 * tRPC mutation `.input()` (the validation authority — `BookingFlow` is a
 * selection wizard with no free-text fields, so it has no RHF resolver) and
 * available to the client for input typing. Client and server validate the
 * same shape so they can never drift (same philosophy as the domain module).
 */
export const createReservationInput = z.object({
	restaurantId: z.string().uuid(),
	startTime: z.date(),
	partySize: z.number().int().min(1),
	tableCount: z.number().int().min(1),
});

export type CreateReservationInput = z.infer<typeof createReservationInput>;
