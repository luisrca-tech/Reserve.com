import type { SessionUser } from "~/features/auth/types";

export type { SessionUser } from "~/features/auth/types";

/** Editable profile fields surfaced in the profile dialog. */
export interface ProfileFormValues {
	name: string;
	email: string;
	phone: string;
}

export function toProfileFormValues(user: SessionUser): ProfileFormValues {
	return {
		name: user.name,
		email: user.email,
		phone: user.phone ?? "",
	};
}
