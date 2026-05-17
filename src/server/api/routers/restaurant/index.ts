import { createTRPCRouter } from "~/server/api/trpc";
import { deleteRestaurant, deleteRestaurantImage } from "./mutations";
import { listGalleryImages } from "./queries";

/**
 * `queries/` and `mutations/` are organisational only — procedures are
 * composed flat here so tRPC call paths stay `restaurant.<procedure>`.
 */
export const restaurantRouter = createTRPCRouter({
	listGalleryImages,
	deleteRestaurantImage,
	deleteRestaurant,
});
