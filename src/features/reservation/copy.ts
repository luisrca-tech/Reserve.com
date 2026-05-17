import type { Reservation } from "./types";

/** UI copy (pt-BR) for the booking flow on the restaurant detail page. */
export const bookingCopy = {
	title: "Reservar mesa",
	stepDate: "1. Escolha a data",
	stepHour: "2. Escolha o horário",
	stepParty: "3. Quantas pessoas?",
	stepTables: "4. Quantas mesas?",
	stepConfirm: "5. Confirmar reserva",
	datePlaceholder: "Selecionar data",
	closedOnDate: "O restaurante não abre neste dia.",
	noSlots: "Nenhum horário disponível para esta data.",
	slotFull: "Esgotado",
	people: (n: number) => `${n} ${n === 1 ? "pessoa" : "pessoas"}`,
	tables: (n: number) => `${n} ${n === 1 ? "mesa" : "mesas"}`,
	tablesRemaining: (n: number) =>
		`${n} ${n === 1 ? "mesa disponível" : "mesas disponíveis"} neste horário`,
	summaryDate: "Data",
	summaryHour: "Horário",
	summaryParty: "Pessoas",
	summaryTables: "Mesas",
	confirm: "Confirmar reserva",
	confirmed: "Reserva criada com sucesso!",
	loginRequired: "Faça login para reservar.",
	weekdays: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const,
	months: [
		"Janeiro",
		"Fevereiro",
		"Março",
		"Abril",
		"Maio",
		"Junho",
		"Julho",
		"Agosto",
		"Setembro",
		"Outubro",
		"Novembro",
		"Dezembro",
	] as const,
} as const;

/** Visual tone for a reservation status badge. */
type StatusTone = "accent" | "green" | "red" | "muted";

/** pt-BR label + tone per reservation status. */
export const statusMeta: Record<
	Reservation["status"],
	{ label: string; tone: StatusTone }
> = {
	pending: { label: "Aguardando confirmação", tone: "accent" },
	confirmed: { label: "Confirmada", tone: "green" },
	completed: { label: "Concluída", tone: "muted" },
	cancelled: { label: "Cancelada", tone: "red" },
	expired: { label: "Expirada", tone: "red" },
};

/** UI copy (pt-BR) for the client reservation history page. */
export const historyCopy = {
	title: "Minhas reservas",
	subtitle: "Acompanhe sua reserva ativa e o histórico de visitas.",
	activeTitle: "Reserva ativa",
	previousTitle: "Reservas anteriores",
	noActiveTitle: "Nenhuma reserva ativa",
	noActiveHint: "Explore os restaurantes e faça sua próxima reserva.",
	noPrevious: "Você ainda não tem reservas anteriores.",
	browseCta: "Ver restaurantes",
	people: (n: number) => `${n} ${n === 1 ? "pessoa" : "pessoas"}`,
	tables: (n: number) => `${n} ${n === 1 ? "mesa" : "mesas"}`,
	cancel: "Cancelar reserva",
	cancelled: "Reserva cancelada.",
	cancelError: "Não foi possível cancelar a reserva. Tente novamente.",
	at: "às",
} as const;
