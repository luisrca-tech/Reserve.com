import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
	"inline-flex cursor-pointer items-center justify-center gap-[0.4rem] rounded-[var(--radius-sm)] font-semibold tracking-[0.01em] outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary:
					"bg-accent text-white hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_6px_20px_rgba(224,117,52,0.35)]",
				secondary:
					"border border-[var(--border)] bg-surface2 text-text hover:border-accent hover:text-accent",
				outline:
					"border-[1.5px] border-accent bg-transparent text-accent hover:bg-accent hover:text-white",
				success:
					"bg-green font-bold text-bg hover:-translate-y-px hover:bg-[#32b87b]",
				danger: "bg-red text-white hover:bg-[#c93535]",
				ghost:
					"border border-[var(--border)] bg-transparent text-muted hover:border-border2 hover:text-text",
			},
			size: {
				default: "px-[1.4rem] py-[0.65rem] text-[0.9rem]",
				lg: "px-8 py-[0.9rem] text-base",
				sm: "rounded-md px-[0.8rem] py-[0.4rem] text-[0.8rem]",
			},
			full: { true: "w-full", false: "" },
		},
		defaultVariants: {
			variant: "primary",
			size: "default",
			full: false,
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, full, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, full, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
