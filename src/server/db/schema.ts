import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["client", "restaurant_owner"]);

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified")
		.$defaultFn(() => false)
		.notNull(),
	image: text("image"),
	role: roleEnum("role").notNull().default("client"),
	phone: text("phone"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
	updatedAt: timestamp("updated_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
});

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
	availability: many(restaurantAvailability),
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

export const userRelations = relations(user, ({ many, one }) => ({
	account: many(account),
	session: many(session),
	restaurant: one(restaurant, {
		fields: [user.id],
		references: [restaurant.ownerId],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));
