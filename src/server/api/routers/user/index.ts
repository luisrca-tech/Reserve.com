import { createTRPCRouter } from "~/server/api/trpc";
import { updateProfile } from "./mutations";

/**
 * `mutations/` is organisational only — procedures are composed flat here so
 * tRPC call paths stay `user.<procedure>`.
 */
export const userRouter = createTRPCRouter({
	updateProfile,
});
