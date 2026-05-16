import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

import {
	createCallerFactory,
	createTRPCRouter,
	ownsRestaurantProcedure,
	roleProcedure,
} from "./trpc";

type Role = "client" | "restaurant_owner";

function makeCtx(opts: {
	user?: { id: string; role: Role } | null;
	restaurantOwnerId?: string | null;
}) {
	const findFirst = vi.fn(async () =>
		opts.restaurantOwnerId === undefined
			? undefined
			: opts.restaurantOwnerId === null
				? undefined
				: { ownerId: opts.restaurantOwnerId },
	);
	return {
		db: { query: { restaurant: { findFirst } } },
		session: opts.user
			? { user: { id: opts.user.id, role: opts.user.role } }
			: null,
		headers: new Headers(),
	} as never;
}

const roleRouter = createTRPCRouter({
	ownerOnly: roleProcedure("restaurant_owner").query(() => "ok"),
});

const ownsRouter = createTRPCRouter({
	mutate: ownsRestaurantProcedure.mutation(() => "ok"),
});

const callRole = createCallerFactory(roleRouter);
const callOwns = createCallerFactory(ownsRouter);

const RESTAURANT_ID = "11111111-1111-1111-1111-111111111111";

describe("roleProcedure", () => {
	it("rejects an unauthenticated request with UNAUTHORIZED", async () => {
		const caller = callRole(makeCtx({ user: null }));
		await expect(caller.ownerOnly()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("rejects a user without an allowed role with FORBIDDEN", async () => {
		const caller = callRole(makeCtx({ user: { id: "u1", role: "client" } }));
		await expect(caller.ownerOnly()).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("passes for a user with an allowed role", async () => {
		const caller = callRole(
			makeCtx({ user: { id: "u1", role: "restaurant_owner" } }),
		);
		await expect(caller.ownerOnly()).resolves.toBe("ok");
	});
});

describe("ownsRestaurantProcedure", () => {
	it("rejects an unauthenticated request with UNAUTHORIZED", async () => {
		const caller = callOwns(makeCtx({ user: null }));
		await expect(
			caller.mutate({ restaurantId: RESTAURANT_ID }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	it("rejects a non-owner with FORBIDDEN", async () => {
		const caller = callOwns(
			makeCtx({
				user: { id: "u1", role: "restaurant_owner" },
				restaurantOwnerId: "someone-else",
			}),
		);
		await expect(
			caller.mutate({ restaurantId: RESTAURANT_ID }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("rejects when the restaurant does not exist", async () => {
		const caller = callOwns(
			makeCtx({
				user: { id: "u1", role: "restaurant_owner" },
				restaurantOwnerId: null,
			}),
		);
		await expect(
			caller.mutate({ restaurantId: RESTAURANT_ID }),
		).rejects.toBeInstanceOf(TRPCError);
	});

	it("passes for the restaurant owner", async () => {
		const caller = callOwns(
			makeCtx({
				user: { id: "owner-1", role: "restaurant_owner" },
				restaurantOwnerId: "owner-1",
			}),
		);
		await expect(
			caller.mutate({ restaurantId: RESTAURANT_ID }),
		).resolves.toBe("ok");
	});
});
