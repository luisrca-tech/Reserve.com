import { pgEnum } from "drizzle-orm/pg-core";

export const reservationStatusEnum = pgEnum("reservation_status", [
	"pending",
	"confirmed",
	"cancelled",
	"expired",
	"completed",
]);
