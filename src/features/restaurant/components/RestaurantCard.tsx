"use client";

import { useRouter } from "next/navigation";

import type { RestaurantView } from "../types";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantView }) {
	const router = useRouter();

	return (
		<button
			className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-surface text-left transition-all duration-200 hover:-translate-y-1 hover:border-border2 hover:shadow-[var(--shadow)]"
			onClick={() => router.push(`/restaurants/${restaurant.id}`)}
			type="button"
		>
			{/* biome-ignore lint/performance/noImgElement: remote mock images, no next/image remote config */}
			<img
				alt={restaurant.name}
				className="h-[180px] w-full object-cover"
				loading="lazy"
				src={restaurant.images[0]}
			/>
			<div className="p-5">
				<div className="mb-1 font-bold font-serif text-[1.4rem] text-text">
					{restaurant.name}
				</div>
				<p className="mb-4 line-clamp-2 text-[0.88rem] text-text2 leading-[1.5]">
					{restaurant.description}
				</p>
				<div className="flex flex-wrap gap-2">
					{restaurant.tags.map((tag) => (
						<span
							className="rounded-full bg-surface3 px-3 py-1 text-[0.75rem] text-text2"
							key={tag}
						>
							{tag}
						</span>
					))}
				</div>
			</div>
		</button>
	);
}
