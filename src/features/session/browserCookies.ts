import {
	clearOnboardedCookie,
	clearSessionCookie,
	readOnboardedCookie,
	readSessionCookie,
	writeOnboardedCookie,
	writeSessionCookie,
} from "~/features/auth/cookie";
import type { SessionCookiePort } from "./sessionState";

/** Browser cookie port backing the mock session in the running app. */
export const browserCookiePort: SessionCookiePort = {
	readSession: readSessionCookie,
	writeSession: writeSessionCookie,
	clearSession: clearSessionCookie,
	readOnboarded: readOnboardedCookie,
	writeOnboarded: writeOnboardedCookie,
	clearOnboarded: clearOnboardedCookie,
};
