import { createTRPCRouter } from "~/server/api/trpc";
import { createReservation } from "./mutations";

/**
 * `queries/` and `mutations/` are organisational only — procedures are
 * composed flat here so tRPC call paths stay `reservation.<procedure>`.
 */
export const reservationRouter = createTRPCRouter({
	create: createReservation,
});
