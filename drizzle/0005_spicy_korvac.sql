ALTER TABLE "reservation" ADD COLUMN "party_size" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "table_count" integer DEFAULT 1 NOT NULL;