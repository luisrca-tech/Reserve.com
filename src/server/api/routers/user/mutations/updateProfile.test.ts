import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { updateProfile } from "./updateProfile";

const USER_ID = "user-1";

function userRow(over: Record<string, unknown> = {}) {
	return {
		id: USER_ID,
		name: "Marcos Andrade",
		email: "marcos@email.com",
		role: "client",
		phone: "(11) 9 8888-0000",
		...over,
	};
}

const validInput = {
	name: "Marcos A.",
	email: "novo@email.com",
	phone: "(11) 9 1234-5678",
};

function makeCtx(opts: {
	session?: unknown;
	emailOwner?: unknown;
	missing?: boolean;
}) {
	const state = { setArg: {} as Record<string, unknown> };
	const userFindFirst = vi.fn(
		async ({ where }: { where?: { __kind?: string } } = {}) => {
			// The conflict pre-check passes a composite `and(...)` predicate; the
			// re-read passes a single `eq(id)` predicate. Distinguish by call order:
			// first call = conflict probe, second = post-write re-read.
			if (userFindFirst.mock.calls.length === 1) {
				return opts.emailOwner ?? undefined;
			}
			if (opts.missing) return undefined;
			return { ...userRow(), ...state.setArg };
		},
	);
	const restaurantFindFirst = vi.fn(async () => undefined);
	const setWhere = vi.fn(async () => undefined);
	const set = vi.fn((arg: Record<string, unknown>) => {
		state.setArg = arg;
		return { where: setWhere };
	});
	const update = vi.fn(() => ({ set }));
	return {
		ctx: {
			db: {
				query: {
					user: { findFirst: userFindFirst },
					restaurant: { findFirst: restaurantFindFirst },
				},
				update,
			},
			session:
				opts.session === undefined
					? { user: { id: USER_ID, role: "client" } }
					: opts.session,
			headers: new Headers(),
		} as never,
		userFindFirst,
		set,
		update,
	};
}

const call = createCallerFactory(createTRPCRouter({ updateProfile }));

describe("user.updateProfile", () => {
	it("rejects an unauthenticated caller", async () => {
		const { ctx } = makeCtx({ session: null });
		await expect(call(ctx).updateProfile(validInput)).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("rejects invalid input (malformed email)", async () => {
		const { ctx } = makeCtx({});
		await expect(
			call(ctx).updateProfile({ ...validInput, email: "not-an-email" }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("rejects when the email is taken by another user", async () => {
		const { ctx } = makeCtx({ emailOwner: { id: "user-2" } });
		await expect(call(ctx).updateProfile(validInput)).rejects.toMatchObject({
			code: "CONFLICT",
		});
	});

	it("persists the mapped fields and returns the session view", async () => {
		const { ctx, set } = makeCtx({});

		const result = await call(ctx).updateProfile(validInput);

		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Marcos A.",
				email: "novo@email.com",
				phone: "(11) 9 1234-5678",
			}),
		);
		expect(result).toMatchObject({
			id: USER_ID,
			name: "Marcos A.",
			email: "novo@email.com",
			phone: "(11) 9 1234-5678",
			role: "client",
			hasRestaurant: false,
		});
	});

	it("stores an empty phone as null", async () => {
		const { ctx, set } = makeCtx({});

		const result = await call(ctx).updateProfile({
			...validInput,
			phone: "   ",
		});

		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ phone: null }),
		);
		expect(result.phone).toBeNull();
	});
});
