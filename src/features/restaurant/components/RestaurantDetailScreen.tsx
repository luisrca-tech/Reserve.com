"use client";

import { api } from "~/trpc/react";
import { detailCopy } from "../copy";
import { RestaurantDetail } from "./RestaurantDetail";

export function RestaurantDetailScreen({
	restaurantId,
}: {
	restaurantId: string;
}) {
	const [restaurant] = api.restaurant.byId.useSuspenseQuery({ restaurantId });

	if (!restaurant) {
		return (
			<div className="dashboard-content flex-1 overflow-y-auto">
				<div className="px-4 py-16 text-center text-muted sm:px-8">
					<div className="mb-4 text-5xl">🔍</div>
					<div className="font-semibold text-text">
						{detailCopy.notFoundTitle}
					</div>
					<div className="mt-1 text-sm">{detailCopy.notFoundHint}</div>
				</div>
			</div>
		);
	}

	return <RestaurantDetail restaurant={restaurant} />;
}
