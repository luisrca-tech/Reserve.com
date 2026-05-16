import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { assetKindEnum } from "./enums";

export const asset = pgTable(
	"asset",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		url: text("url").notNull(),
		key: text("key"),
		mimeType: text("mime_type").notNull(),
		kind: assetKindEnum("kind").notNull(),
		sizeBytes: integer("size_bytes"),
		uploadedById: text("uploaded_by_id").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [index("asset_uploaded_by_id_idx").on(table.uploadedById)],
);

export const assetRelations = relations(asset, ({ one }) => ({
	uploadedBy: one(user, {
		fields: [asset.uploadedById],
		references: [user.id],
	}),
}));
