import type { AriaAttributes, ComponentProps } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { cn } from "@/lib/utils";

export type ResponsiveSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const nativeSelectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-background";

type SelectRootProps = ComponentProps<typeof Select>;

/** DOM props applied to both the native control and the shadcn trigger. */
type SharedControlProps = {
  id?: string;
  className?: string;
  style?: ComponentProps<"select">["style"];
  title?: string;
  tabIndex?: number;
  autoFocus?: boolean;
  hidden?: boolean;
} & AriaAttributes & {
    [key: `data-${string}`]: string | number | undefined;
  };

export type ResponsiveSelectProps = Omit<SelectRootProps, "children"> &
  SharedControlProps & {
    options: ResponsiveSelectOption[];
    placeholder?: string;
    /** Overrides for the shadcn trigger (fine pointer). */
    triggerProps?: Omit<ComponentProps<typeof SelectTrigger>, "children">;
    /** Overrides for the shadcn menu (fine pointer). */
    contentProps?: Omit<ComponentProps<typeof SelectContent>, "children">;
    /** Overrides for the native select (coarse pointer). */
    nativeProps?: Omit<ComponentProps<"select">, "children">;
  };

export function ResponsiveSelect({
  options,
  placeholder,
  triggerProps,
  contentProps,
  nativeProps,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  dir,
  name,
  autoComplete,
  disabled,
  required,
  form,
  id,
  className,
  style,
  title,
  tabIndex,
  autoFocus,
  hidden,
  ...ariaAndData
}: ResponsiveSelectProps) {
  const coarse = useCoarsePointer();
  const sharedDom = {
    id,
    style,
    title,
    tabIndex,
    autoFocus,
    hidden,
    ...ariaAndData,
  };
  if (sharedDom["aria-required"] == null && required) {
    sharedDom["aria-required"] = true;
  }

  if (coarse) {
    const { className: nativeClassName, ...restNative } = nativeProps ?? {};
    const valueProps =
      value !== undefined
        ? { value }
        : defaultValue !== undefined
          ? { defaultValue }
          : {};
    return (
      <select
        {...sharedDom}
        name={name}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        form={form}
        {...valueProps}
        onChange={(event) => onValueChange?.(event.target.value)}
        className={cn(nativeSelectClassName, className, nativeClassName)}
        {...restNative}
      >
        {placeholder ? (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const { className: triggerClassName, ...restTrigger } = triggerProps ?? {};

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      dir={dir}
      name={name}
      autoComplete={autoComplete}
      disabled={disabled}
      required={required}
      form={form}
    >
      <SelectTrigger
        {...sharedDom}
        {...restTrigger}
        className={cn("w-full", className, triggerClassName)}
        {...(required
          ? ({ required: true } as { "aria-required"?: boolean })
          : {})}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent {...contentProps}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
