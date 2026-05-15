import type { asset } from "../asset";

export type Asset = typeof asset.$inferSelect;
export type NewAsset = typeof asset.$inferInsert;
