import { createTRPCRouter } from "~/server/api/trpc";
import { ownerReservations, ownerRestaurant } from "./queries";

/**
 * `queries/` and `mutations/` are organisational only — procedures are
 * composed flat here so tRPC call paths stay `owner.<procedure>`.
 * Mutations land in P4b/P4c.
 */
export const ownerRouter = createTRPCRouter({
	restaurant: ownerRestaurant,
	reservations: ownerReservations,
});
