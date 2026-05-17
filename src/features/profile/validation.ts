import { z } from "zod";

/**
 * Single source of truth for the update-profile contract, imported by the
 * tRPC `user.updateProfile` `.input()` (the validation authority) and by the
 * `ProfileDialog` client `zodResolver`. Client and server validate the exact
 * same shape so they can never drift (same philosophy as the domain module
 * and the owner/auth validation modules).
 */
export const updateProfileInput = z.object({
	name: z.string().trim().min(1, "Informe seu nome"),
	email: z.string().trim().email("Informe um e-mail válido"),
	phone: z.string().trim(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInput>;
