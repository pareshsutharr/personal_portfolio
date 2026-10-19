import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[background-color,border-color,color,transform] duration-200 ease-out-expo disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-ember-400 focus-visible:outline-offset-2 rounded-sm";

const variants: Record<Variant, string> = {
  primary: "bg-fg-50 text-bg-950 hover:bg-ember-400 hover:text-bg-950 active:translate-y-px",
  secondary:
    "bg-surface-700 text-fg-100 border border-line-700 hover:border-line-600 hover:bg-surface-600",
  outline: "border border-line-600 text-fg-100 hover:border-fg-300 hover:bg-surface-800",
  ghost: "text-fg-300 hover:text-fg-50 hover:bg-surface-800",
  danger: "bg-crimson-600 text-fg-50 hover:bg-crimson-500",
  link: "text-ember-400 underline-offset-4 hover:underline h-auto px-0",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-sm tracking-wide",
  icon: "h-9 w-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});

type AnyHref = React.ComponentProps<typeof Link>["href"];

export interface ButtonLinkProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href: AnyHref | string;
  variant?: Variant;
  size?: Size;
  external?: boolean;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  external,
  href,
  children,
  ...props
}: ButtonLinkProps) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (external || (typeof href === "string" && /^(https?:|mailto:|tel:)/.test(href))) {
    return (
      <a
        href={href as string}
        className={classes}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href as AnyHref} className={classes} {...props}>
      {children}
    </Link>
  );
}
