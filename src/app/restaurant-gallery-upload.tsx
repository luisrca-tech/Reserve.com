"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { UploadDropzone } from "~/lib/uploadthing";
import { api } from "~/trpc/react";

function isRestaurantUuid(value: string) {
	return z.string().uuid().safeParse(value).success;
}

export function RestaurantGalleryUpload() {
	const router = useRouter();
	const [restaurantId, setRestaurantId] = useState("");

	const restaurantIdIsValid = isRestaurantUuid(restaurantId);

	const images = api.restaurant.listGalleryImages.useQuery(
		{ restaurantId },
		{ enabled: restaurantIdIsValid },
	);

	const deleteImage = api.restaurant.deleteRestaurantImage.useMutation({
		onSuccess: async () => {
			await images.refetch();
			router.refresh();
		},
	});

	const canUpload = restaurantIdIsValid;

	return (
		<div className="flex w-full max-w-md flex-col items-center gap-3">
			<label className="flex w-full flex-col gap-1 text-sm">
				<span>Restaurant ID (UUID)</span>
				<input
					className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50"
					onChange={(event) => setRestaurantId(event.target.value.trim())}
					placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
					type="text"
					value={restaurantId}
				/>
			</label>

			{canUpload ? (
				<UploadDropzone
					endpoint="restaurantImage"
					input={{ restaurantId }}
					onClientUploadComplete={() => {
						void images.refetch();
						router.refresh();
					}}
					onUploadError={(error) => {
						console.error("Restaurant gallery upload failed", error);
					}}
				/>
			) : restaurantId.length > 0 ? (
				<p className="text-sm text-amber-200/90">
					Invalid UUID format. Copy the id from the restaurant table (Drizzle
					Studio).
				</p>
			) : (
				<p className="text-sm text-white/70">
					Paste a restaurant id from your database to upload.
				</p>
			)}

			{images.data && images.data.length > 0 ? (
				<ul className="flex w-full flex-col gap-2 text-sm">
					{images.data.map((image) => (
						<li
							className="flex items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-2"
							key={image.id}
						>
							<span className="truncate">
								#{image.sortOrder} — {image.asset.url}
							</span>
							<button
								className="shrink-0 rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
								disabled={deleteImage.isPending}
								onClick={() =>
									deleteImage.mutate({ restaurantImageId: image.id })
								}
								type="button"
							>
								Remove
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
