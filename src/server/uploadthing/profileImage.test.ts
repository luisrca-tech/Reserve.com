import { describe, expect, it, vi } from "vitest";

import {
	completeProfileUpload,
	resolveProfileUploadMetadata,
} from "./profileImage";

vi.mock("./publicUploadMode", () => ({
	isPublicUploadMode: () => false,
}));

function makeAuth(session: { user: { id: string } } | null) {
	return {
		api: { getSession: vi.fn(async () => session) },
	} as never;
}

/**
 * Minimal Drizzle-shaped mock that records the order of side effects so a test
 * can assert the old UploadThing file is deleted before the new asset is
 * persisted.
 */
function makeDb(opts: {
	currentImage?: string | null;
	previousAsset?: { id: string; key: string | null } | null;
	calls: string[];
}) {
	return {
		query: {
			user: {
				findFirst: vi.fn(async () => ({ image: opts.currentImage ?? null })),
			},
			asset: {
				findFirst: vi.fn(async () => opts.previousAsset ?? undefined),
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn(async () => {
					opts.calls.push("insert-asset");
					return [{ id: "new-asset" }];
				}),
			})),
		})),
		delete: vi.fn(() => ({
			where: vi.fn(async () => {
				opts.calls.push("delete-asset-row");
			}),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(async () => {
					opts.calls.push("update-user-image");
				}),
			})),
		})),
	} as never;
}

describe("resolveProfileUploadMetadata", () => {
	it("rejects an unauthenticated request", async () => {
		await expect(
			resolveProfileUploadMetadata({
				headers: new Headers(),
				auth: makeAuth(null),
				db: makeDb({ calls: [] }),
			}),
		).rejects.toThrow();
	});

	it("derives the user id from the session, never from the client", async () => {
		const result = await resolveProfileUploadMetadata({
			headers: new Headers(),
			auth: makeAuth({ user: { id: "session-user" } }),
			db: makeDb({ calls: [] }),
		});
		expect(result).toEqual({ userId: "session-user" });
	});
});

describe("completeProfileUpload", () => {
	it("deletes the previous UploadThing file before persisting the new asset", async () => {
		const calls: string[] = [];
		const deleteFiles = vi.fn(async () => {
			calls.push("delete-old-file");
		});
		const db = makeDb({
			currentImage: "https://old.example/avatar.png",
			previousAsset: { id: "old-asset", key: "old-key" },
			calls,
		});

		await completeProfileUpload(
			{
				userId: "u1",
				url: "https://new.example/avatar.png",
				key: "new-key",
				mimeType: "image/png",
				sizeBytes: 1234,
			},
			{ db, utapi: { deleteFiles } as never },
		);

		expect(deleteFiles).toHaveBeenCalledWith("old-key");
		expect(calls.indexOf("delete-old-file")).toBeLessThan(
			calls.indexOf("insert-asset"),
		);
		expect(calls).toContain("update-user-image");
	});

	it("inserts the asset without deleting when there is no previous image", async () => {
		const calls: string[] = [];
		const deleteFiles = vi.fn(async () => undefined);
		const db = makeDb({ currentImage: null, calls });

		await completeProfileUpload(
			{
				userId: "u1",
				url: "https://new.example/avatar.png",
				key: "new-key",
				mimeType: "image/webp",
				sizeBytes: 999,
			},
			{ db, utapi: { deleteFiles } as never },
		);

		expect(deleteFiles).not.toHaveBeenCalled();
		expect(calls).toContain("insert-asset");
		expect(calls).toContain("update-user-image");
	});
});
