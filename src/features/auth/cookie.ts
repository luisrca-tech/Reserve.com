export const SESSION_COOKIE = "reserve_uid";
/**
 * Set when an owner-without-restaurant completes onboarding. The server
 * session reader promotes them to owner-with-restaurant so the dashboard
 * gate opens — mock-only stand-in for persisting the new restaurant row.
 */
export const ONBOARDED_COOKIE = "reserve_onboarded";

const ONE_WEEK = 60 * 60 * 24 * 7;

/** Browser-only cookie helpers backing the mock session. */
export function writeSessionCookie(userId: string) {
	// biome-ignore lint/suspicious/noDocumentCookie: mock-only session; the cookie is read server-side in route-group layouts via next/headers.
	document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
		userId,
	)}; path=/; max-age=${ONE_WEEK}; samesite=lax`;
}

export function clearSessionCookie() {
	// biome-ignore lint/suspicious/noDocumentCookie: mock-only session reset; mirrors writeSessionCookie.
	document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function readSessionCookie(): string | null {
	const match = document.cookie
		.split("; ")
		.find((row) => row.startsWith(`${SESSION_COOKIE}=`));
	return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

export function writeOnboardedCookie() {
	// biome-ignore lint/suspicious/noDocumentCookie: mock-only promotion flag; read server-side in the owner dashboard gate.
	document.cookie = `${ONBOARDED_COOKIE}=1; path=/; max-age=${ONE_WEEK}; samesite=lax`;
}

export function clearOnboardedCookie() {
	// biome-ignore lint/suspicious/noDocumentCookie: mock-only reset; mirrors writeOnboardedCookie.
	document.cookie = `${ONBOARDED_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function readOnboardedCookie(): boolean {
	return document.cookie
		.split("; ")
		.some((row) => row === `${ONBOARDED_COOKIE}=1`);
}
