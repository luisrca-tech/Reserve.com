import { createHash } from "node:crypto";

/**
 * Fixed namespace for the seed module. Combined with a readable slug it yields a
 * stable UUIDv5, so the same slug always maps to the same primary key across
 * full runs, individual seeder runs, and separate processes.
 */
const SEED_NAMESPACE = "6f1d8e2a-3b4c-5d6e-8f90-1a2b3c4d5e6f";

function uuidToBytes(uuid: string): Buffer {
	return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

function formatUuid(bytes: Buffer): string {
	const hex = bytes.toString("hex");
	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		hex.slice(12, 16),
		hex.slice(16, 20),
		hex.slice(20, 32),
	].join("-");
}

export function slugToUuid(slug: string): string {
	const digest = createHash("sha1")
		.update(Buffer.concat([uuidToBytes(SEED_NAMESPACE), Buffer.from(slug, "utf8")]))
		.digest();

	const bytes = Buffer.from(digest.subarray(0, 16));
	bytes[6] = (bytes[6]! & 0x0f) | 0x50;
	bytes[8] = (bytes[8]! & 0x3f) | 0x80;

	return formatUuid(bytes);
}
