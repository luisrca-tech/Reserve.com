import type {
	category,
	restaurant,
	restaurantAvailability,
	restaurantImage,
} from "../restaurant";

export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;

export type Restaurant = typeof restaurant.$inferSelect;
export type NewRestaurant = typeof restaurant.$inferInsert;

export type RestaurantAvailability = typeof restaurantAvailability.$inferSelect;
export type NewRestaurantAvailability =
	typeof restaurantAvailability.$inferInsert;

export type RestaurantImage = typeof restaurantImage.$inferSelect;
export type NewRestaurantImage = typeof restaurantImage.$inferInsert;
