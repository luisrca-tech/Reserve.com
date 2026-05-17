import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import {
	normalizeCategoryName,
	resolveCategory,
} from "~/features/restaurant/onboarding";
import { createRestaurantInput } from "~/features/restaurant/validation";
import { roleProcedure } from "~/server/api/trpc";
import {
	category,
	restaurant,
	restaurantAvailability,
} from "~/server/db/schema";

/**
 * Onboarding create. The owner is resolved from `ctx.session.user.id` — never
 * client input — and may own only one restaurant (`CONFLICT` otherwise). The
 * category is duplicate-safe: a directly supplied `categoryId` wins, else the
 * shared `resolveCategory` matches an existing category by normalized name or
 * a new one is created. The category creation, restaurant row, and the
 * availability rows run in one transaction so capacity logic can never observe
 * a half-applied restaurant. Returns the new id so the client can bind the
 * uploaded gallery images to it.
 */
export const createRestaurant = roleProcedure("restaurant_owner")
	.input(createRestaurantInput)
	.mutation(async ({ ctx, input }): Promise<{ id: string }> => {
		const existing = await ctx.db.query.restaurant.findFirst({
			where: eq(restaurant.ownerId, ctx.session.user.id),
			columns: { id: true },
		});
		if (existing) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Você já possui um restaurante.",
			});
		}

		let resolvedCategoryId = input.categoryId;
		let newCategoryName: string | null = null;

		if (!resolvedCategoryId) {
			const categories = await ctx.db.query.category.findMany({
				columns: { id: true, name: true },
			});
			const resolution = resolveCategory(
				input.newCategoryName ?? "",
				categories,
			);
			if (resolution.kind === "empty") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Selecione ou crie uma categoria.",
				});
			}
			if (resolution.kind === "existing") {
				resolvedCategoryId = resolution.category.id;
			} else {
				newCategoryName = resolution.name;
			}
		}

		const availabilityHours = Object.entries(input.hoursByWeekday).flatMap(
			([weekday, hours]) =>
				(hours ?? []).map((hour) => ({ weekday: Number(weekday), hour })),
		);

		const id = await ctx.db.transaction(async (tx) => {
			let categoryId = resolvedCategoryId;
			if (!categoryId) {
				const [createdCategory] = await tx
					.insert(category)
					.values({ name: normalizeCategoryName(newCategoryName ?? "") })
					.returning({ id: category.id });
				if (!createdCategory) {
					throw new Error("Failed to create category row");
				}
				categoryId = createdCategory.id;
			}

			const [created] = await tx
				.insert(restaurant)
				.values({
					ownerId: ctx.session.user.id,
					name: input.name,
					corporateEmail: input.corporateEmail,
					address: input.address,
					bio: input.bio,
					phone: input.phone,
					categoryId,
					tableCount: input.tableCount,
				})
				.returning({ id: restaurant.id });
			if (!created) {
				throw new Error("Failed to create restaurant row");
			}

			if (availabilityHours.length > 0) {
				await tx.insert(restaurantAvailability).values(
					availabilityHours.map((row) => ({
						restaurantId: created.id,
						weekday: row.weekday,
						hour: row.hour,
					})),
				);
			}

			return created.id;
		});

		return { id };
	});
