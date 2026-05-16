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

export const onboardingCopy = {
	title: "Cadastrar restaurante",
	subtitle: "Configure seu espaço para começar a receber reservas.",
	stepOf: (current: number, total: number) => `Etapa ${current} de ${total}`,
	back: "Voltar",
	next: "Próximo",
	submit: "Cadastrar restaurante",
	submitting: "Cadastrando…",
	success: "Restaurante cadastrado! Bem-vindo ao seu painel.",
	validationError: "Revise os campos destacados antes de continuar.",

	steps: ["Dados", "Categoria", "Capacidade", "Fotos", "Cardápio"] as const,

	// Step 1 — basics
	basicsTitle: "Dados do restaurante",
	nameLabel: "Nome do restaurante",
	namePlaceholder: "Cantina Bella",
	corporateEmailLabel: "Email corporativo",
	corporateEmailPlaceholder: "contato@restaurante.com",
	phoneLabel: "Telefone",
	phonePlaceholder: "(11) 3000-0000",
	addressLabel: "Endereço completo",
	addressPlaceholder: "Rua das Flores, 123 — São Paulo, SP",
	bioLabel: "Bio / Descrição",
	bioPlaceholder: "Conte um pouco sobre seu restaurante…",

	// Step 2 — category
	categoryTitle: "Categoria",
	categoryHint:
		"Busque uma categoria existente ou crie uma nova. Categorias duplicadas são unificadas automaticamente.",
	categorySearchPlaceholder: "Ex.: Italiana, Japonesa…",
	categoryCreate: (name: string) => `Criar categoria “${name}”`,
	categorySelected: (name: string) => `Selecionada: ${name}`,
	categoryNoResults: "Nenhuma categoria existente. Crie uma nova acima.",

	// Step 3 — capacity & hours
	capacityTitle: "Capacidade e horários",
	tableCountLabel: "Total de mesas",
	tableCountValue: (n: number) => `${n} ${n === 1 ? "mesa" : "mesas"}`,
	hoursLabel: "Funcionamento por dia",
	weekdayNames: [
		"Domingo",
		"Segunda",
		"Terça",
		"Quarta",
		"Quinta",
		"Sexta",
		"Sábado",
	] as const,
	closed: "Fechado",
	open: "Aberto",
	openHour: "Abre",
	closeHour: "Fecha",
	hourValue: (h: number) => `${String(h).padStart(2, "0")}:00`,

	// Step 4 — images
	imagesTitle: "Fotos do ambiente",
	imagesHint: "Envie ao menos 4 fotos do interior/exterior.",
	imagesPick: "Selecionar fotos",
	imagesCount: (n: number) =>
		`${n} ${n === 1 ? "foto enviada" : "fotos enviadas"} (mínimo 4)`,
	imageRemove: "Remover",

	// Step 5 — menu
	menuTitle: "Cardápio",
	menuHint: "Envie o cardápio em PDF ou imagem.",
	menuPick: "Selecionar cardápio",
	menuReady: (name: string) => `Cardápio pronto: ${name}`,
	menuRemove: "Remover cardápio",
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
