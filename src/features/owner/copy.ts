/** UI copy (pt-BR) for the owner dashboard panel. */
export const ownerCopy = {
	brand: "ReServe",
	panelLabel: "Painel do restaurante",

	nav: {
		overview: "Visão geral",
		tables: "Mesas",
		reservations: "Reservas",
		settings: "Configurações",
	},

	notifications: {
		title: "Notificações",
		empty: "Nenhuma notificação no momento.",
		clear: "Limpar tudo",
		reminder: (name: string, time: string) =>
			`Reserva de ${name} às ${time} começa em breve.`,
		expired: (name: string, time: string) =>
			`Reserva de ${name} às ${time} expirou sem confirmação.`,
		lowTables: (time: string, remaining: number) =>
			`Poucas mesas às ${time}: restam ${remaining}.`,
		autoConfirmed: (name: string) =>
			`Reserva de ${name} confirmada automaticamente.`,
	},

	profile: {
		trigger: "Editar perfil",
		logout: "Sair da conta",
		logoutSuccess: "Sessão encerrada.",
	},

	overview: {
		title: "Visão geral",
		subtitle: "Acompanhe o desempenho do seu restaurante hoje.",
		statTables: "Total de mesas",
		statToday: "Reservas de hoje",
		statPending: "Aguardando confirmação",
		statConfirmed: "Confirmadas hoje",
		todayTitle: "Reservas de hoje",
		todayEmpty: "Nenhuma reserva para hoje.",
	},

	tables: {
		title: "Mesas",
		subtitle: "Uso de mesas por horário e ajuste da capacidade total.",
		dateLabel: "Selecione o dia",
		closedDay: "O restaurante não abre neste dia.",
		usageTitle: "Uso por horário",
		used: (used: number, total: number) => `${used}/${total} mesas`,
		free: (n: number) => `${n} ${n === 1 ? "mesa livre" : "mesas livres"}`,
		full: "Lotado",
		capacityTitle: "Capacidade total",
		capacityHint: "Defina quantas mesas o restaurante oferece.",
		tableCountValue: (n: number) => `${n} ${n === 1 ? "mesa" : "mesas"}`,
		save: "Salvar capacidade",
		saved: "Capacidade atualizada.",
	},

	reservations: {
		title: "Reservas",
		subtitle: "Valide reservas pendentes e gerencie a confirmação.",
		autoConfirmLabel: "Travar agendamento automático",
		autoConfirmHint:
			"Quando ativo, reservas são confirmadas sem validação manual.",
		autoConfirmOn: "Confirmação automática ativada.",
		autoConfirmOff: "Confirmação automática desativada.",
		empty: "Nenhuma reserva registrada.",
		colClient: "Cliente",
		colWhen: "Data e horário",
		colParty: "Pessoas",
		colTables: "Mesas",
		colPhone: "Telefone",
		colStatus: "Status",
		validate: "Validar",
		validated: "Reserva confirmada.",
		people: (n: number) => `${n} ${n === 1 ? "pessoa" : "pessoas"}`,
		tables: (n: number) => `${n} ${n === 1 ? "mesa" : "mesas"}`,
		at: "às",
	},

	settings: {
		title: "Configurações",
		subtitle: "Edite os dados e a disponibilidade do restaurante.",
		nameLabel: "Nome do restaurante",
		phoneLabel: "Telefone",
		bioLabel: "Bio / Descrição",
		availabilityLabel: "Funcionamento por dia",
		closed: "Fechado",
		open: "Aberto",
		openHour: "Abre",
		closeHour: "Fecha",
		hourValue: (h: number) => `${String(h).padStart(2, "0")}:00`,
		weekdayNames: [
			"Domingo",
			"Segunda",
			"Terça",
			"Quarta",
			"Quinta",
			"Sexta",
			"Sábado",
		] as const,
		save: "Salvar alterações",
		saved: "Configurações atualizadas.",
	},

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
	weekdaysShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const,
} as const;
