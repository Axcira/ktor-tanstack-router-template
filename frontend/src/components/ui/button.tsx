import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Link, type LinkComponentProps } from "@tanstack/react-router"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-md",
  {
    variants: {
      variant: {
        elevated: "bg-surface-container text-primary hover:bg-primary hover:text-primary-foreground",
        filled: "bg-primary text-on-primary hover:brightness-110 transition-all",
        outline:
          "border-outline-variant bg-transparent text-on-surface-variant hover:bg-surface-variant hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        tertiary: "bg-tertiary text-tertiary-foreground hover:brightness-110 transition-all",
        secondary:
          "bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
      shape: {
        round: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "elevated",
      size: "default",
      shape: "square",
    },
  }
)

function Button({
  className,
  variant = "elevated",
  size = "default",
  shape = "square",
  nativeButton,
  render,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-shape={shape}
      data-size={size}
      className={cn(buttonVariants({ variant, size, shape, className }))}
      nativeButton={nativeButton ?? rendersNativeButton(render)}
      render={render}
      {...props}
    />
  )
}

function rendersNativeButton(render: ButtonPrimitive.Props["render"]) {
  if (render == null || typeof render === "function") {
    return true
  }
  return render.type === "button"
}

type ButtonLinkProps = LinkComponentProps<"a"> &
  VariantProps<typeof buttonVariants>

function ButtonLink({
  className,
  variant = "elevated",
  size = "default",
  shape = "square",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      data-slot="button"
      data-variant={variant}
      data-shape={shape}
      data-size={size}
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  )
}

export { Button, ButtonLink, buttonVariants }
