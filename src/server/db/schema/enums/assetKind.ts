import { pgEnum } from "drizzle-orm/pg-core";

export const assetKindEnum = pgEnum("asset_kind", ["image", "pdf"]);
