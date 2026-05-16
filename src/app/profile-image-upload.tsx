"use client";

import { useRouter } from "next/navigation";

import { UploadButton } from "~/lib/uploadthing";

export function ProfileImageUpload() {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center gap-2">
			<UploadButton
				endpoint="profileImage"
				onClientUploadComplete={() => {
					router.refresh();
				}}
				onUploadError={(error) => {
					console.error("Profile image upload failed", error);
				}}
			/>
		</div>
	);
}
