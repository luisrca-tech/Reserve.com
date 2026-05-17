import { z } from "zod";

/**
 * Single source of truth for the create-restaurant (onboarding) contract,
 * imported by the tRPC `restaurant.create` `.input()` (the validation
 * authority) and by the `OnboardingFlow` client `zodResolver`. Client and
 * server validate the exact same shape so they can never drift (same
 * philosophy as the domain module and the other validation modules).
 *
 * Gallery images and the menu are uploaded via uploadthing *after* the row
 * exists, so they are client-only step gates, not part of this input.
 */
export const createRestaurantInput = z
	.object({
		name: z.string().trim().min(1, "Informe o nome do restaurante"),
		corporateEmail: z
			.string()
			.trim()
			.email("Informe um email corporativo válido"),
		phone: z.string().trim().min(1, "Informe o telefone"),
		address: z.string().trim().min(1, "Informe o endereço"),
		bio: z.string().trim().min(1, "Descreva o restaurante"),
		categoryId: z.string().uuid().nullable(),
		newCategoryName: z.string().trim().min(1).nullable(),
		tableCount: z.number().int().min(1, "Informe ao menos 1 mesa"),
		/** weekday (0–6) → open whole hours (0–23); empty/missing = closed. */
		hoursByWeekday: z.record(
			z.coerce.number().int().min(0).max(6),
			z.array(z.number().int().min(0).max(23)),
		),
	})
	.refine((d) => Boolean(d.categoryId) || Boolean(d.newCategoryName), {
		message: "Selecione ou crie uma categoria",
		path: ["newCategoryName"],
	})
	.refine((d) => Object.values(d.hoursByWeekday).some((h) => h.length > 0), {
		message: "Defina ao menos um dia de funcionamento",
		path: ["hoursByWeekday"],
	});

export type CreateRestaurantInput = z.infer<typeof createRestaurantInput>;
