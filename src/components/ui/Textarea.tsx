import * as React from "react";

import { cn } from "~/lib/utils";

const Textarea = React.forwardRef<
	HTMLTextAreaElement,
	React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
	<textarea
		className={cn(
			"min-h-[90px] w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border)] bg-surface2 px-4 py-3 text-[0.9rem] text-text transition-colors",
			"placeholder:text-muted",
			"focus:border-accent focus:bg-surface3 focus:outline-none",
			"disabled:cursor-not-allowed disabled:opacity-50",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
Textarea.displayName = "Textarea";

export { Textarea };
