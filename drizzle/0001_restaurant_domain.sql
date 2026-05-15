CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"corporate_email" text NOT NULL,
	"address" text NOT NULL,
	"bio" text,
	"phone" text NOT NULL,
	"category_id" uuid NOT NULL,
	"table_count" integer NOT NULL,
	"auto_confirm_enabled" boolean DEFAULT false NOT NULL,
	"low_table_threshold" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"hour" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_availability" ADD CONSTRAINT "restaurant_availability_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_name_unique" ON "category" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_owner_id_unique" ON "restaurant" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_corporate_email_unique" ON "restaurant" USING btree ("corporate_email");--> statement-breakpoint
CREATE INDEX "restaurant_category_id_idx" ON "restaurant" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "restaurant_name_idx" ON "restaurant" USING btree ("name");--> statement-breakpoint
CREATE INDEX "restaurant_name_trgm_idx" ON "restaurant" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "restaurant_availability_restaurant_weekday_idx" ON "restaurant_availability" USING btree ("restaurant_id","weekday");