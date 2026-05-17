import { createTRPCRouter } from "~/server/api/trpc";
import {
	cancelReservation,
	completeReservation,
	confirmReservation,
} from "./mutations";
import { ownerReservations, ownerRestaurant } from "./queries";

/**
 * `queries/` and `mutations/` are organisational only — procedures are
 * composed flat here so tRPC call paths stay `owner.<procedure>`.
 * Settings update lands in P4c.
 */
export const ownerRouter = createTRPCRouter({
	restaurant: ownerRestaurant,
	reservations: ownerReservations,
	confirmReservation,
	cancelReservation,
	completeReservation,
});
