"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BookingFlow } from "~/features/reservation/components/BookingFlow";
import { detailCopy } from "../copy";
import { formatAvailability } from "../mappers";
import type { RestaurantView } from "../types";

export function RestaurantDetail({
	restaurant,
}: {
	restaurant: RestaurantView;
}) {
	const router = useRouter();
	const [activeImage, setActiveImage] = useState(0);
	const { days, hours } = formatAvailability(restaurant.hoursByWeekday);

	const infoItems = [
		{ label: detailCopy.addressLabel, value: restaurant.address },
		{ label: detailCopy.hoursLabel, value: hours },
		{ label: detailCopy.daysLabel, value: days },
		{
			label: detailCopy.tablesLabel,
			value: detailCopy.tablesValue(restaurant.tableCount),
		},
	];

	return (
		<div className="dashboard-content flex-1 overflow-y-auto">
			<div className="mx-auto max-w-[860px] px-4 py-6 sm:px-8">
				<button
					className="mb-4 inline-flex items-center gap-2 text-muted text-sm transition-colors hover:text-accent"
					onClick={() => router.push("/restaurants")}
					type="button"
				>
					<ArrowLeft size={16} />
					{detailCopy.back}
				</button>

				<div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-surface">
					<div className="relative h-[280px] w-full">
						{/* biome-ignore lint/performance/noImgElement: remote mock images */}
						<img
							alt={restaurant.name}
							className="h-full w-full object-cover"
							src={restaurant.images[activeImage]}
						/>
						<div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(23,23,23,1)_0%,transparent_60%)]" />
						<div className="absolute right-6 bottom-5 left-6">
							<span className="inline-block rounded-full border border-[rgba(224,117,52,0.25)] bg-accent-soft px-3 py-1 text-[0.75rem] text-accent">
								{restaurant.categoryName}
							</span>
							<div className="mt-2 font-bold font-serif text-[2rem] text-text">
								{restaurant.name}
							</div>
						</div>
					</div>

					{restaurant.images.length > 1 && (
						<div className="flex gap-2 overflow-x-auto border-[var(--border)] border-b p-3">
							{restaurant.images.map((src, i) => (
								<button
									className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
										i === activeImage
											? "border-accent"
											: "border-transparent opacity-70 hover:opacity-100"
									}`}
									key={src}
									onClick={() => setActiveImage(i)}
									type="button"
								>
									{/* biome-ignore lint/performance/noImgElement: remote mock images */}
									<img
										alt={`${restaurant.name} ${i + 1}`}
										className="h-full w-full object-cover"
										src={src}
									/>
								</button>
							))}
						</div>
					)}

					<div className="p-6">
						<p className="mb-4 text-[0.95rem] text-text2 leading-[1.7]">
							{restaurant.description}
						</p>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{infoItems.map((item) => (
								<div
									className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 p-4"
									key={item.label}
								>
									<div className="mb-1 text-[0.78rem] text-muted">
										{item.label}
									</div>
									<div className="font-medium text-[0.9rem] text-text">
										{item.value}
									</div>
								</div>
							))}
						</div>

						{restaurant.menuUrl && (
							<div className="mt-6">
								<div className="mb-2 text-[0.78rem] text-muted">
									{detailCopy.menuLabel}
								</div>
								{restaurant.menuKind === "pdf" ? (
									<a
										className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-3 text-[0.9rem] text-text transition-colors hover:border-accent"
										href={restaurant.menuUrl}
										rel="noreferrer"
										target="_blank"
									>
										{detailCopy.menuOpen}
									</a>
								) : (
									// biome-ignore lint/performance/noImgElement: remote menu asset
									<img
										alt={detailCopy.menuLabel}
										className="w-full rounded-[var(--radius-sm)] border border-[var(--border)]"
										src={restaurant.menuUrl}
									/>
								)}
							</div>
						)}
					</div>

					<BookingFlow restaurant={restaurant} />
				</div>
			</div>
		</div>
	);
}
