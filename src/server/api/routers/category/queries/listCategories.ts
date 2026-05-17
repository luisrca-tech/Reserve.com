import { publicProcedure } from "~/server/api/trpc";

/** All categories, name-ordered, as flat `{ id, name }` view models. */
export const listCategories = publicProcedure.query(({ ctx }) =>
	ctx.db.query.category.findMany({
		columns: { id: true, name: true },
		orderBy: (table, { asc }) => [asc(table.name)],
	}),
);
