import { describe, expect, it, vi } from "vitest";

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import {
	category,
	restaurant,
	restaurantAvailability,
} from "~/server/db/schema";
import { createRestaurant } from "./createRestaurant";

const OWNER_ID = "owner-1";
const NEW_RID = "11111111-1111-1111-1111-111111111111";
const NEW_CID = "22222222-2222-2222-2222-222222222222";
const EXISTING_CID = "33333333-3333-3333-3333-333333333333";

const baseInput = {
	name: "Cantina Nova",
	corporateEmail: "contato@cantinanova.com",
	phone: "(11) 3000-0000",
	address: "Rua A, 1 — São Paulo, SP",
	bio: "Um cantinho aconchegante.",
	categoryId: null as string | null,
	newCategoryName: "Peruana" as string | null,
	tableCount: 12,
	hoursByWeekday: { 5: [19, 20], 6: [12] } as Record<number, number[]>,
};

type Insert = {
	table: "category" | "restaurant" | "availability";
	rows: unknown;
};

function makeCtx(opts: {
	session?: unknown;
	existing?: unknown;
	categories?: { id: string; name: string }[];
}) {
	const inserts: Insert[] = [];

	const findRestaurant = vi.fn(async () => opts.existing);
	const findCategories = vi.fn(async () => opts.categories ?? []);

	const nameOf = (tbl: unknown): Insert["table"] => {
		if (tbl === category) return "category";
		if (tbl === restaurant) return "restaurant";
		if (tbl === restaurantAvailability) return "availability";
		throw new Error("unexpected insert target");
	};

	const insert = vi.fn((tbl: unknown) => {
		const table = nameOf(tbl);
		const values = vi.fn((rows: unknown) => {
			inserts.push({ table, rows });
			return {
				returning: vi.fn(async () =>
					table === "category"
						? [{ id: NEW_CID }]
						: table === "restaurant"
							? [{ id: NEW_RID }]
							: [],
				),
			};
		});
		return { values };
	});

	const tx = { insert };
	const transaction = vi.fn(async (cb: (t: typeof tx) => Promise<unknown>) =>
		cb(tx),
	);

	return {
		ctx: {
			db: {
				query: {
					restaurant: { findFirst: findRestaurant },
					category: { findMany: findCategories },
				},
				transaction,
			},
			session:
				opts.session === undefined
					? { user: { id: OWNER_ID, role: "restaurant_owner" } }
					: opts.session,
			headers: new Headers(),
		} as never,
		inserts,
		findRestaurant,
		insert,
	};
}

const call = createCallerFactory(createTRPCRouter({ createRestaurant }));

describe("restaurant.create", () => {
	it("rejects an unauthenticated caller", async () => {
		const { ctx } = makeCtx({ session: null });
		await expect(call(ctx).createRestaurant(baseInput)).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("rejects a non-owner role", async () => {
		const { ctx } = makeCtx({
			session: { user: { id: "u9", role: "client" } },
		});
		await expect(call(ctx).createRestaurant(baseInput)).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("rejects invalid input (blank name)", async () => {
		const { ctx } = makeCtx({});
		await expect(
			call(ctx).createRestaurant({ ...baseInput, name: "   " }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("rejects input with no category", async () => {
		const { ctx } = makeCtx({});
		await expect(
			call(ctx).createRestaurant({
				...baseInput,
				categoryId: null,
				newCategoryName: null,
			}),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("rejects input with no open day", async () => {
		const { ctx } = makeCtx({});
		await expect(
			call(ctx).createRestaurant({ ...baseInput, hoursByWeekday: {} }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("rejects when the owner already has a restaurant", async () => {
		const { ctx } = makeCtx({ existing: { id: "old-rid" } });
		await expect(call(ctx).createRestaurant(baseInput)).rejects.toMatchObject({
			code: "CONFLICT",
		});
	});

	it("creates a new category, the restaurant, and availability rows", async () => {
		const { ctx, inserts } = makeCtx({ categories: [] });

		const result = await call(ctx).createRestaurant(baseInput);

		expect(result).toEqual({ id: NEW_RID });

		const cat = inserts.find((i) => i.table === "category");
		expect(cat?.rows).toMatchObject({ name: "Peruana" });

		const rest = inserts.find((i) => i.table === "restaurant");
		expect(rest?.rows).toMatchObject({
			ownerId: OWNER_ID,
			name: "Cantina Nova",
			corporateEmail: "contato@cantinanova.com",
			categoryId: NEW_CID,
			tableCount: 12,
		});

		const avail = inserts.find((i) => i.table === "availability");
		expect(avail?.rows).toEqual(
			expect.arrayContaining([
				{ restaurantId: NEW_RID, weekday: 5, hour: 19 },
				{ restaurantId: NEW_RID, weekday: 5, hour: 20 },
				{ restaurantId: NEW_RID, weekday: 6, hour: 12 },
			]),
		);
	});

	it("reuses an existing category matched by name (no category insert)", async () => {
		const { ctx, inserts } = makeCtx({
			categories: [{ id: EXISTING_CID, name: "Peruana" }],
		});

		await call(ctx).createRestaurant(baseInput);

		expect(inserts.find((i) => i.table === "category")).toBeUndefined();
		expect(inserts.find((i) => i.table === "restaurant")?.rows).toMatchObject({
			categoryId: EXISTING_CID,
		});
	});

	it("uses a directly supplied categoryId without touching categories", async () => {
		const { ctx, inserts, findRestaurant } = makeCtx({});

		await call(ctx).createRestaurant({
			...baseInput,
			categoryId: EXISTING_CID,
			newCategoryName: null,
		});

		expect(findRestaurant).toHaveBeenCalled();
		expect(inserts.find((i) => i.table === "category")).toBeUndefined();
		expect(inserts.find((i) => i.table === "restaurant")?.rows).toMatchObject({
			categoryId: EXISTING_CID,
		});
	});
});
