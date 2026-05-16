/** UI copy (pt-BR) for the client browse + restaurant detail surfaces. */
export const browseCopy = {
	searchPlaceholder: "Buscar restaurantes…",
	searchCancel: "Cancelar",
	navHome: "Início",
	navHistory: "Histórico",
	navNotifications: "Notificações",
	noNotifications: "Você não tem novas notificações.",
	logout: "Sair da conta",
	logoutSuccess: "Sessão encerrada.",
	filterAll: "Todos",
	sectionTitle: "Restaurantes disponíveis",
	resultCount: (n: number) =>
		`${n} ${n === 1 ? "restaurante encontrado" : "restaurantes encontrados"}`,
	emptyTitle: "Nenhum restaurante encontrado",
	emptyHint: "Tente outra busca ou remova os filtros.",
	footerCopyright: "© 2026 ReServe. Todos os direitos reservados.",
	footerCredits: "Projeto Integrador · Grupo 41 · Senac",
} as const;

export const detailCopy = {
	back: "Voltar",
	addressLabel: "📍 Endereço",
	hoursLabel: "⏰ Horários",
	daysLabel: "📅 Funcionamento",
	tablesLabel: "🪑 Mesas",
	tablesValue: (n: number) => `${n} mesas`,
	notFoundTitle: "Restaurante não encontrado",
	notFoundHint: "Esse restaurante não está mais disponível.",
	bookCta: "Reservar mesa",
	bookComingSoon: "O fluxo de reserva chega na próxima fase.",
} as const;
