import { describe, expect, it, vi } from "vitest";

import { createCallerFactory } from "~/server/api/trpc";
import { categoryRouter } from "..";

function makeCtx(categories: Array<{ id: string; name: string }>) {
	const findMany = vi.fn(async () => categories);
	return {
		db: { query: { category: { findMany } } },
		session: null,
		headers: new Headers(),
	} as never;
}

const call = createCallerFactory(categoryRouter);

describe("category.list", () => {
	it("returns id + name for each category", async () => {
		const caller = call(
			makeCtx([
				{ id: "c1", name: "Italiana" },
				{ id: "c2", name: "Japonesa" },
			]),
		);

		await expect(caller.list()).resolves.toEqual([
			{ id: "c1", name: "Italiana" },
			{ id: "c2", name: "Japonesa" },
		]);
	});

	it("returns an empty array when there are no categories", async () => {
		const caller = call(makeCtx([]));
		await expect(caller.list()).resolves.toEqual([]);
	});
});
