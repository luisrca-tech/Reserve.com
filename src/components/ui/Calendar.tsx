"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "~/lib/utils";

const MONTHS = [
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
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Token-styled, pt-BR `react-day-picker`. Closed/past days are expressed
 * by the caller through the `disabled` matcher prop.
 */
export function Calendar({
	className,
	classNames,
	...props
}: React.ComponentProps<typeof DayPicker>) {
	return (
		<DayPicker
			className={cn("w-[300px]", className)}
			classNames={{
				months: "flex flex-col",
				month: "space-y-3",
				month_caption: "flex items-center justify-center h-9 relative",
				caption_label: "font-medium text-[0.9rem] text-text",
				nav: "absolute inset-x-0 flex items-center justify-between",
				button_previous:
					"rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-text",
				button_next:
					"rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-text",
				month_grid: "w-full border-collapse",
				weekdays: "flex",
				weekday: "w-9 text-center text-[0.7rem] font-normal text-muted",
				week: "flex w-full mt-1",
				day: "h-9 w-9 p-0 text-center",
				day_button:
					"h-9 w-9 rounded-md text-[0.8rem] text-text transition-colors hover:bg-surface2 aria-selected:bg-accent aria-selected:text-white",
				today: "font-semibold text-accent aria-selected:text-white",
				outside: "text-muted/40",
				disabled: "cursor-not-allowed text-muted/30 hover:bg-transparent",
				hidden: "invisible",
				...classNames,
			}}
			components={{
				Chevron: ({ orientation }) =>
					orientation === "left" ? (
						<ChevronLeft size={18} />
					) : (
						<ChevronRight size={18} />
					),
			}}
			formatters={{
				formatCaption: (date) =>
					`${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
				formatWeekdayName: (date) => WEEKDAYS[date.getDay()] ?? "",
			}}
			showOutsideDays
			{...props}
		/>
	);
}
