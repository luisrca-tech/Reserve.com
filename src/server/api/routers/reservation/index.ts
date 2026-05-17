import { createTRPCRouter } from "~/server/api/trpc";
import { cancelReservation, createReservation } from "./mutations";
import { listReservations } from "./queries";

/**
 * `queries/` and `mutations/` are organisational only — procedures are
 * composed flat here so tRPC call paths stay `reservation.<procedure>`.
 */
export const reservationRouter = createTRPCRouter({
	create: createReservation,
	list: listReservations,
	cancel: cancelReservation,
});
