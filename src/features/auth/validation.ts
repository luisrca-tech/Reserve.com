import { z } from "zod";

/**
 * Single source of truth for the auth form contracts. Imported by the client
 * `zodResolver` today; ready to back a server validator unchanged so client
 * and server can never drift (same philosophy as the domain module). Auth
 * itself is handled by Better Auth, so there is no tRPC procedure to share
 * with yet — the shape is the contract.
 */

/** Better Auth's default minimum password length. */
const PASSWORD_MIN = 8;

const email = z.string().trim().email();
const requiredText = (label: string) => z.string().trim().min(1, label);

/** Login must not re-validate password strength against existing credentials. */
export const loginSchema = z.object({
	email,
	password: z.string().min(1),
});

export const clientRegisterSchema = z.object({
	name: requiredText("Informe seu nome"),
	email,
	phone: requiredText("Informe seu telefone"),
	password: z.string().min(PASSWORD_MIN),
});

export const ownerRegisterSchema = z.object({
	restaurantName: requiredText("Informe o nome do restaurante"),
	corporateEmail: email,
	phone: requiredText("Informe o telefone"),
	address: requiredText("Informe o endereço"),
	bio: requiredText("Descreva o restaurante"),
	password: z.string().min(PASSWORD_MIN),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type ClientRegisterValues = z.infer<typeof clientRegisterSchema>;
export type OwnerRegisterValues = z.infer<typeof ownerRegisterSchema>;
