export const SESSION_COOKIE = "reserve_uid";

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
