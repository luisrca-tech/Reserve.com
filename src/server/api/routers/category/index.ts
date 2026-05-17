import { createTRPCRouter } from "~/server/api/trpc";
import { listCategories } from "./queries";

/**
 * `queries/` and `mutations/` are organisational only — procedures are
 * composed flat here so tRPC call paths stay `category.<procedure>`.
 */
export const categoryRouter = createTRPCRouter({
	list: listCategories,
});
