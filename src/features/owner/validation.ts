import { z } from "zod";

/**
 * Single source of truth for the update-settings contract, imported by the
 * tRPC `owner.updateSettings` `.input()` (the validation authority) and by
 * the `OwnerSettings` client `zodResolver`. Client and server validate the
 * exact same shape so they can never drift (same philosophy as the domain
 * module and the reservation/auth validation modules).
 */
export const updateSettingsInput = z.object({
	name: z.string().trim().min(1, "Informe o nome do restaurante"),
	phone: z.string().trim().min(1, "Informe o telefone"),
	bio: z.string().trim().min(1, "Descreva o restaurante"),
	autoConfirmEnabled: z.boolean(),
	lowTableThreshold: z.number().int().min(1),
	tableCount: z.number().int().min(1),
	/** weekday (0–6) → open whole hours (0–23); empty/missing day = closed. */
	hoursByWeekday: z.record(
		z.coerce.number().int().min(0).max(6),
		z.array(z.number().int().min(0).max(23)),
	),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsInput>;
