import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { reservationStatusEnum } from "./enums";
import { restaurant } from "./restaurant";

export const reservation = pgTable(
	"reservation",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		restaurantId: uuid("restaurant_id")
			.notNull()
			.references(() => restaurant.id, { onDelete: "cascade" }),
		startTime: timestamp("start_time", { withTimezone: true }).notNull(),
		endTime: timestamp("end_time", { withTimezone: true }).notNull(),
		partySize: integer("party_size").notNull().default(2),
		tableCount: integer("table_count").notNull().default(1),
		status: reservationStatusEnum("status").notNull().default("pending"),
		validatedAt: timestamp("validated_at", { withTimezone: true }),
		cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("reservation_user_restaurant_start_unique").on(
			table.userId,
			table.restaurantId,
			table.startTime,
		),
		index("reservation_restaurant_start_status_idx").on(
			table.restaurantId,
			table.startTime,
			table.status,
		),
		index("reservation_user_id_idx").on(table.userId),
		index("reservation_status_start_idx").on(table.status, table.startTime),
	],
);

export const reservationRelations = relations(reservation, ({ one }) => ({
	user: one(user, {
		fields: [reservation.userId],
		references: [user.id],
	}),
	restaurant: one(restaurant, {
		fields: [reservation.restaurantId],
		references: [restaurant.id],
	}),
}));
