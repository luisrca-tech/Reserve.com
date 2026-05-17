import { createTRPCRouter } from "~/server/api/trpc";
import { deleteRestaurant, deleteRestaurantImage } from "./mutations";
import {
	listGalleryImages,
	listRestaurants,
	restaurantAvailability,
	restaurantById,
} from "./queries";

/**
 * `queries/` and `mutations/` are organisational only — procedures are
 * composed flat here so tRPC call paths stay `restaurant.<procedure>`.
 */
export const restaurantRouter = createTRPCRouter({
	list: listRestaurants,
	byId: restaurantById,
	availability: restaurantAvailability,
	listGalleryImages,
	deleteRestaurantImage,
	deleteRestaurant,
});
