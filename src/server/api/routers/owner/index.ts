import { createTRPCRouter } from "~/server/api/trpc";
import {
	cancelReservation,
	completeReservation,
	confirmReservation,
	updateSettings,
} from "./mutations";
import { ownerReservations, ownerRestaurant } from "./queries";

/**
 * `queries/` and `mutations/` are organisational only — procedures are
 * composed flat here so tRPC call paths stay `owner.<procedure>`.
 */
export const ownerRouter = createTRPCRouter({
	restaurant: ownerRestaurant,
	reservations: ownerReservations,
	confirmReservation,
	cancelReservation,
	completeReservation,
	updateSettings,
});
