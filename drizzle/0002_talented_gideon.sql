CREATE TYPE "public"."asset_kind" AS ENUM('image', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'cancelled', 'expired', 'completed');--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"kind" "asset_kind" NOT NULL,
	"size_bytes" integer,
	"uploaded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"validated_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "menu_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_image" ADD CONSTRAINT "restaurant_image_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_image" ADD CONSTRAINT "restaurant_image_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_uploaded_by_id_idx" ON "asset" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reservation_user_restaurant_start_unique" ON "reservation" USING btree ("user_id","restaurant_id","start_time");--> statement-breakpoint
CREATE INDEX "reservation_restaurant_start_status_idx" ON "reservation" USING btree ("restaurant_id","start_time","status");--> statement-breakpoint
CREATE INDEX "reservation_user_id_idx" ON "reservation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reservation_status_start_idx" ON "reservation" USING btree ("status","start_time");--> statement-breakpoint
CREATE INDEX "restaurant_image_restaurant_id_idx" ON "restaurant_image" USING btree ("restaurant_id");--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_menu_asset_id_asset_id_fk" FOREIGN KEY ("menu_asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;