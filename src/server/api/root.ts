import { categoryRouter } from "~/server/api/routers/category";
import { ownerRouter } from "~/server/api/routers/owner";
import { reservationRouter } from "~/server/api/routers/reservation";
import { restaurantRouter } from "~/server/api/routers/restaurant";
import { userRouter } from "~/server/api/routers/user";
import {
	createCallerFactory,
	createTRPCRouter,
	publicProcedure,
} from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	health: publicProcedure.query(() => "ok"),
	restaurant: restaurantRouter,
	category: categoryRouter,
	reservation: reservationRouter,
	owner: ownerRouter,
	user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 */
export const createCaller = createCallerFactory(appRouter);
