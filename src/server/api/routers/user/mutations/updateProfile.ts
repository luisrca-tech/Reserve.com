import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { resolveSessionUser } from "~/features/auth/sessionResolver";
import type { SessionUser } from "~/features/auth/types";
import { updateProfileInput } from "~/features/profile/validation";
import { protectedProcedure } from "~/server/api/trpc";
import { restaurant, user } from "~/server/db/schema";

/**
 * Any authenticated user updates their own profile (name, email, phone). The
 * row is resolved from `ctx.session.user.id` — never client input — so a user
 * can only ever edit their own. Email is unique: a collision with another
 * user is a `CONFLICT` (pre-checked so the failure is deterministic, not a
 * raw driver error). An empty phone is persisted as `null`. Returns the
 * finished `SessionUser` (via the shared session mapper) so the client
 * reconciles to server truth.
 */
export const updateProfile = protectedProcedure
	.input(updateProfileInput)
	.mutation(async ({ ctx, input }): Promise<SessionUser> => {
		const userId = ctx.session.user.id;
		const phone = input.phone === "" ? null : input.phone;

		const emailOwner = await ctx.db.query.user.findFirst({
			where: and(eq(user.email, input.email), ne(user.id, userId)),
		});
		if (emailOwner) {
			throw new TRPCError({ code: "CONFLICT" });
		}

		await ctx.db
			.update(user)
			.set({
				name: input.name,
				email: input.email,
				phone,
				updatedAt: new Date(),
			})
			.where(eq(user.id, userId));

		const updated = await ctx.db.query.user.findFirst({
			where: eq(user.id, userId),
		});
		if (!updated) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}

		const resolved = await resolveSessionUser(
			{ user: updated },
			async (ownerId) =>
				(await ctx.db.query.restaurant.findFirst({
					where: eq(restaurant.ownerId, ownerId),
				})) != null,
		);
		if (!resolved) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}
		return resolved;
	});
