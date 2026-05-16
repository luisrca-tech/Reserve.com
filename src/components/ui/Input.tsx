import * as React from "react";

import { cn } from "~/lib/utils";

const Input = React.forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
	<input
		className={cn(
			"w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-3 text-[0.9rem] text-text transition-colors",
			"placeholder:text-muted",
			"focus:border-accent focus:bg-surface3 focus:outline-none",
			"disabled:cursor-not-allowed disabled:opacity-50",
			className,
		)}
		ref={ref}
		type={type}
		{...props}
	/>
));
Input.displayName = "Input";

export { Input };
