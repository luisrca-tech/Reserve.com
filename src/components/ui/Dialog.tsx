"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		className={cn(
			"fixed inset-0 z-[500] bg-black/75 backdrop-blur-[8px]",
			"data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const sizeClass = {
	default: "max-w-[520px]",
	lg: "max-w-[680px]",
	xl: "max-w-[820px]",
} as const;

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		size?: keyof typeof sizeClass;
	}
>(({ className, children, size = "default", ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			className={cn(
				"fixed top-1/2 left-1/2 z-[501] grid w-[calc(100%-2rem)] gap-4 [transform:translate(-50%,-50%)]",
				"max-h-[90vh] overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-surface p-6 shadow-[var(--shadow-lg)]",
				"data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=open]:animate-in",
				sizeClass[size],
				className,
			)}
			ref={ref}
			{...props}
		>
			{children}
			<DialogPrimitive.Close
				aria-label="Fechar"
				className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-muted transition-all hover:bg-surface3 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			>
				<X size={18} />
				<span className="sr-only">Fechar</span>
			</DialogPrimitive.Close>
		</DialogPrimitive.Content>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("flex flex-col gap-1.5 pr-10", className)} {...props} />
	);
}
DialogHeader.displayName = "DialogHeader";

function DialogFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className,
			)}
			{...props}
		/>
	);
}
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		className={cn("font-semibold font-serif text-2xl text-text", className)}
		ref={ref}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		className={cn("text-muted text-sm", className)}
		ref={ref}
		{...props}
	/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
