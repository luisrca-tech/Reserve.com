import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { asset } from "./asset";
import { user } from "./auth";
import { reservation } from "./reservation";

export const category = pgTable(
	"category",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [uniqueIndex("category_name_unique").on(table.name)],
);

export const restaurant = pgTable(
	"restaurant",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		ownerId: text("owner_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		corporateEmail: text("corporate_email").notNull(),
		address: text("address").notNull(),
		bio: text("bio"),
		phone: text("phone").notNull(),
		categoryId: uuid("category_id")
			.notNull()
			.references(() => category.id),
		tableCount: integer("table_count").notNull(),
		autoConfirmEnabled: boolean("auto_confirm_enabled")
			.notNull()
			.default(false),
		lowTableThreshold: integer("low_table_threshold").notNull().default(5),
		menuAssetId: uuid("menu_asset_id").references(() => asset.id),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("restaurant_owner_id_unique").on(table.ownerId),
		uniqueIndex("restaurant_corporate_email_unique").on(table.corporateEmail),
		index("restaurant_category_id_idx").on(table.categoryId),
		index("restaurant_name_idx").on(table.name),
		index("restaurant_name_trgm_idx").using(
			"gin",
			sql`${table.name} gin_trgm_ops`,
		),
	],
);

export const restaurantAvailability = pgTable(
	"restaurant_availability",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		restaurantId: uuid("restaurant_id")
			.notNull()
			.references(() => restaurant.id, { onDelete: "cascade" }),
		weekday: integer("weekday").notNull(),
		hour: integer("hour").notNull(),
	},
	(table) => [
		index("restaurant_availability_restaurant_weekday_idx").on(
			table.restaurantId,
			table.weekday,
		),
	],
);

export const restaurantImage = pgTable(
	"restaurant_image",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		restaurantId: uuid("restaurant_id")
			.notNull()
			.references(() => restaurant.id, { onDelete: "cascade" }),
		assetId: uuid("asset_id")
			.notNull()
			.references(() => asset.id, { onDelete: "cascade" }),
		sortOrder: integer("sort_order").notNull(),
	},
	(table) => [
		index("restaurant_image_restaurant_id_idx").on(table.restaurantId),
	],
);

export const categoryRelations = relations(category, ({ many }) => ({
	restaurants: many(restaurant),
}));

export const restaurantRelations = relations(restaurant, ({ one, many }) => ({
	owner: one(user, {
		fields: [restaurant.ownerId],
		references: [user.id],
	}),
	category: one(category, {
		fields: [restaurant.categoryId],
		references: [category.id],
	}),
	menuAsset: one(asset, {
		fields: [restaurant.menuAssetId],
		references: [asset.id],
	}),
	availability: many(restaurantAvailability),
	reservations: many(reservation),
	images: many(restaurantImage),
}));

export const restaurantAvailabilityRelations = relations(
	restaurantAvailability,
	({ one }) => ({
		restaurant: one(restaurant, {
			fields: [restaurantAvailability.restaurantId],
			references: [restaurant.id],
		}),
	}),
);

export const restaurantImageRelations = relations(
	restaurantImage,
	({ one }) => ({
		restaurant: one(restaurant, {
			fields: [restaurantImage.restaurantId],
			references: [restaurant.id],
		}),
		asset: one(asset, {
			fields: [restaurantImage.assetId],
			references: [asset.id],
		}),
	}),
);
